'use server'

import { EraResult } from '@/types/book'
import { MAX_ERA_BATCH_SIZE } from '@/lib/constants'
import { buildEraPrompt, parseEraResponse } from '@/lib/eraPrompt'

interface BookInput {
  title: string
  author: string
  description?: string
  subjects?: string[]
}

// Main export: extract historical eras for a batch of books
export async function extractEras(books: BookInput[]): Promise<(EraResult | null)[]> {
  if (books.length === 0) return []

  // Process in batches of MAX_ERA_BATCH_SIZE
  const results: (EraResult | null)[] = []
  for (let i = 0; i < books.length; i += MAX_ERA_BATCH_SIZE) {
    const batch = books.slice(i, i + MAX_ERA_BATCH_SIZE)
    const batchResults = await extractBatch(batch)
    results.push(...batchResults)
  }
  return results
}

async function extractBatch(books: BookInput[]): Promise<(EraResult | null)[]> {
  const prompt = buildEraPrompt(books)

  // Primary path: claude-agent-sdk (uses Claude Code login, no API key needed locally)
  // Fallback path: direct @anthropic-ai/sdk (needs ANTHROPIC_API_KEY, used on Vercel)
  const useDirectApi = !!process.env.ANTHROPIC_API_KEY

  if (useDirectApi) {
    return extractBatchDirect(prompt, books.length)
  }
  return extractBatchAgentSdk(prompt, books.length)
}

async function extractBatchAgentSdk(prompt: string, count: number): Promise<(EraResult | null)[]> {
  try {
    const { query } = await import('@anthropic-ai/claude-agent-sdk')
    let resultText = ''

    const claudeQuery = query({
      prompt,
      options: {
        tools: [],
        persistSession: false,
        maxTurns: 3,
        permissionMode: 'bypassPermissions',
        model: 'claude-haiku-4-5-20251001',
      },
    })

    for await (const msg of claudeQuery) {
      if (msg.type === 'result' && msg.subtype === 'success') {
        resultText = (msg as { type: string; subtype: string; result?: string }).result ?? ''
      }
    }

    return parseEraResponse(resultText, count)
  } catch (err) {
    console.error('[extractEras] agent SDK error:', err)
    return Array(count).fill(null)
  }
}

async function extractBatchDirect(prompt: string, count: number): Promise<(EraResult | null)[]> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return parseEraResponse(text, count)
  } catch (err) {
    console.error('[extractEras] direct API error:', err)
    return Array(count).fill(null)
  }
}

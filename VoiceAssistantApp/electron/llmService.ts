import { GoogleGenerativeAI } from '@google/generative-ai'
import type { FunctionDescriptor } from '../src/types/FunctionDescriptor'

let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null

function getModel() {
    if (!model) {
        const key = process.env.GEMINI_API_KEY ?? ''
        if (!key) console.warn('[llm] GEMINI_API_KEY is not set — check your .env file')
        const genAI = new GoogleGenerativeAI(key)
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    }
    return model
}

/**
 * Ask Gemini to generate a FunctionDescriptor for a natural-language command
 * that did not match anything already stored in ChromaDB.
 */
export async function generateFunction(
    userQuery: string
): Promise<FunctionDescriptor> {
    const prompt = `You are a smart-home voice-command engineer.

Given the user's natural-language command below, produce a JSON object that
follows this TypeScript interface EXACTLY — no extra keys, no markdown fences,
just raw JSON:

interface FunctionDescriptor {
    function_id: string        // snake_case unique id, e.g. "lock_door_001"
    function_desc: string      // one-sentence description of what the command does
    regex_phrases: string[]    // 3 regex patterns that would match this command
    logic: string              // pseudo-JS that executes the action
    slots?: Record<string, string>  // named capture groups if the command has parameters
    metadata: {
        confidence_score: number  // your confidence 0-1
        usage_count: number       // start at 0
    }
}

User command: "${userQuery}"

Respond with ONLY the JSON object, nothing else.`

    const result = await getModel().generateContent(prompt)
    const text = result.response.text().trim()

    // Strip markdown fences if the model wraps in ```json ... ```
    const cleaned = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

    const parsed: FunctionDescriptor = JSON.parse(cleaned)

    console.log(`[llm] Generated function "${parsed.function_id}" for query "${userQuery}"`)
    return parsed
}

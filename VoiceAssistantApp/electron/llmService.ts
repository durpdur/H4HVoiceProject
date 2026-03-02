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
    const prompt = `interface FunctionDescriptor {
    function_id: string; // snake_case, e.g., "set_temp_001"
    function_desc: string; // Short one sentence description of function, use as many repeated words as user command as possible
    regex_phrases: string[]; // 3 valid regex patterns; double-escape backslashes
    logic: string; // Pseudo-python
    response_phrase: string; // Natural voice response
    slots?: Record<string, string>; // Extracted entities from userQuery
    metadata: { confidence_score: number; usage_count: 0; }
}

User command: "${userQuery}"

Return ONLY the raw JSON object. Do not include markdown formatting, backticks, or any preamble. 
Ensure the JSON is valid and parsable.`

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

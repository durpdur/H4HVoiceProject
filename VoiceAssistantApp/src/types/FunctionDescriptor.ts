export interface FunctionDescriptor {
    function_id: string
    function_desc: string
    regex_phrases: string[]
    logic: string
    response_phrase: string
    slots?: Record<string, string>;
    metadata: {
        confidence_score: number
        usage_count: number
    }
}
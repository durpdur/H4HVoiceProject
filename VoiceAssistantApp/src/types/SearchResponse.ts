import type { FunctionDescriptor } from "./FunctionDescriptor"

export interface SearchMatch {
    fd: FunctionDescriptor
    distance: number
    confidence: number
}

export interface SearchResponse {
    matched: boolean
    results: SearchMatch[]
}
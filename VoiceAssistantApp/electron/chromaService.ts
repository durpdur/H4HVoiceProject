import { ChromaClient, Collection } from "chromadb"
import type { SearchResponse } from "../src/types/SearchResponse"

export interface FunctionDescriptor {
    function_id: string
    function_desc: string
    regex_phrases: string[]
    logic: string
    response_phrase: string
    slots?: Record<string, string>
    metadata: {
        confidence_score: number
        usage_count: number
    }
}

let client: ChromaClient
let collection: Collection

export async function initChroma(): Promise<void> {
    client = new ChromaClient({ host: "localhost", port: 8000 })
    collection = await client.getOrCreateCollection({ name: "voice_commands" })
}

function toChroma(fd: FunctionDescriptor) {
    return {
        id: fd.function_id,
        document: fd.function_desc, // ✅ embedded
        metadata: {
            // store EVERYTHING else
            regex_phrases: JSON.stringify(fd.regex_phrases),
            logic: fd.logic,
            response_phrase: fd.response_phrase,
            slots: fd.slots ? JSON.stringify(fd.slots) : "",
            confidence_score: fd.metadata.confidence_score,
            usage_count: fd.metadata.usage_count,
        },
    }
}

function fromChroma(id: string, document: string, md: any): FunctionDescriptor {
    return {
        function_id: id,
        function_desc: document,
        regex_phrases: md?.regex_phrases ? JSON.parse(md.regex_phrases) : [],
        logic: md?.logic ?? "",
        response_phrase: md?.response_phrase ?? "",
        slots: md?.slots ? (md.slots === "" ? undefined : JSON.parse(md.slots)) : undefined,
        metadata: {
            confidence_score: Number(md?.confidence_score ?? 0),
            usage_count: Number(md?.usage_count ?? 0),
        },
    }
}

export async function upsertFunction(fd: FunctionDescriptor): Promise<void> {
    const rec = toChroma(fd)
    await collection.upsert({
        ids: [rec.id],
        documents: [rec.document],
        metadatas: [rec.metadata],
    })
}

export async function getFunction(functionId: string): Promise<FunctionDescriptor | null> {
    const res = await collection.get({ ids: [functionId], include: ["documents", "metadatas"] })
    const id = res.ids?.[0]
    if (!id) return null
    const doc = res.documents?.[0] ?? ""
    const md = res.metadatas?.[0] ?? {}
    return fromChroma(id, doc, md)
}

export async function deleteFunction(functionId: string): Promise<void> {
    await collection.delete({ ids: [functionId] })
}

export async function listFunctions(): Promise<FunctionDescriptor[]> {
    const res = await collection.get({ include: ["documents", "metadatas"] })
    const ids = res.ids ?? []
    const docs = res.documents ?? []
    const mds = res.metadatas ?? []
    return ids.map((id, i) => fromChroma(id, docs[i] ?? "", mds[i] ?? {}))
}

export async function searchFunctions(
    text: string,
    nResults = 5,
    distanceThreshold = 1.2
): Promise<SearchResponse> {

    const raw = await collection.query({
        queryTexts: [text],
        nResults,
        include: ["documents", "metadatas", "distances"],
    })

    const ids = raw.ids?.[0] ?? []
    const docs = raw.documents?.[0] ?? []
    const mds = raw.metadatas?.[0] ?? []
    const dists = raw.distances?.[0] ?? []

    const results = ids
        .map((id, i) => ({
            id,
            doc: docs[i] ?? "",
            md: mds[i] ?? {},
            distance: dists[i],
        }))
        .filter((r) => r.distance != null && r.distance <= distanceThreshold)
        .map((r) => {
            const distance = r.distance!

            // Logistic confidence curve
            const midpoint = 0.85   // distance where confidence ≈ 0.5
            const sharpness = 6     // higher = steeper drop
            const confidence =
                (1 / (1 + Math.exp(sharpness * (distance - midpoint)))) * 100

            return {
                fd: fromChroma(r.id, r.doc, r.md),
                distance,
                confidence,
            }
        })

    return { matched: results.length > 0, results }
}
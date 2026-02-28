import { ChromaClient, Collection } from 'chromadb'

let client: ChromaClient
let collection: Collection

/**
 * Initialise the ChromaDB client and get/create the voice_commands collection.
 * Call this once at app startup (after the Chroma server is running).
 */
export async function initChroma(): Promise<void> {
    client = new ChromaClient({ host: 'localhost', port: 8000 })
    collection = await client.getOrCreateCollection({ name: 'voice_commands' })
    console.log('[chroma] Connected — collection "voice_commands" ready')
}

/**
 * Add or update a command in the collection.
 * ChromaDB will generate embeddings from `description` automatically via the
 * default embedding function.
 */
export async function addCommand(
    id: string,
    description: string,
    regexPhrases: string[]
): Promise<void> {
    await collection.upsert({
        ids: [id],
        documents: [description],
        metadatas: [{ regex_phrases: JSON.stringify(regexPhrases) }],
    })
    console.log(`[chroma] Upserted command "${id}"`)
}

/**
 * Query commands by natural-language text.
 * Returns the top `nResults` closest matches whose distance is within
 * `distanceThreshold`.  ChromaDB distances are L2 (lower = more similar).
 *
 * The returned object includes:
 *  - `matched` – true if at least one result was within the threshold
 *  - `results` – only the results that passed the threshold filter
 */
export async function queryCommands(
    text: string,
    nResults = 5,
    distanceThreshold = 0.75
) {
    const raw = await collection.query({
        queryTexts: [text],
        nResults,
        include: ['documents', 'metadatas', 'distances'],
    })

    // raw.distances is number[][] (one inner array per query text)
    const distances = raw.distances?.[0] ?? []
    const ids = raw.ids?.[0] ?? []
    const documents = raw.documents?.[0] ?? []
    const metadatas = raw.metadatas?.[0] ?? []

    // Keep only results within the threshold
    const filtered = ids
        .map((id, i) => ({
            id,
            document: documents[i],
            metadata: metadatas[i],
            distance: distances[i],
        }))
        .filter((r) => r.distance != null && r.distance <= distanceThreshold)

    const matched = filtered.length > 0

    console.log(
        `[chroma] Query "${text}" → ${ids.length} raw hits, ${filtered.length} within threshold (${distanceThreshold})`
    )

    return { matched, results: filtered }
}

/**
 * Get a single command by its ID.
 */
export async function getCommand(id: string) {
    const results = await collection.get({
        ids: [id],
    })
    return results
}

/**
 * Delete a command by its ID.
 */
export async function deleteCommand(id: string): Promise<void> {
    await collection.delete({ ids: [id] })
    console.log(`[chroma] Deleted command "${id}"`)
}

/**
 * List every command in the collection.
 */
export async function getAllCommands() {
    const results = await collection.get()
    return results
}

import {
    Document,
    MetadataMode,
    SentenceSplitter,
    VectorStoreIndex,
    getNodesFromDocument,
    serviceContextFromDefaults,
} from "llamaindex";

export type Embedding = {
    text: string;
    embedding: number[];
};

export default async function splitAndEmbed(
    document: string,
): Promise<Embedding[]> {
    const nodes = getNodesFromDocument(
        new Document({ text: document }),
        new SentenceSplitter({
            chunkSize: 500,
            chunkOverlap: 20,
        }),
    );

    const nodesWithEmbeddings = await VectorStoreIndex.getNodeEmbeddingResults(
        nodes,
        serviceContextFromDefaults(),
        true,
    );

    const result = nodesWithEmbeddings.map((nodeWithEmbedding) => ({
        text: nodeWithEmbedding.getContent(MetadataMode.NONE),
        embedding: nodeWithEmbedding.getEmbedding(),
    }));
    return result;
}

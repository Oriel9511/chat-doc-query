import {StreamingTextResponse} from "ai";
import {
    ChatHistory,
    ChatMessage,
    DefaultContextGenerator,
    HistoryChatEngine,
    IndexDict,
    OpenAI,
    ServiceContext,
    SimpleChatHistory,
    SummaryChatHistory,
    TextNode,
    VectorStoreIndex,
    serviceContextFromDefaults,
} from "llamaindex";
import { NextRequest, NextResponse } from "next/server";
import { Embedding } from "../fetch/embedding";


async function createIndex(
    serviceContext: ServiceContext,
    embeddings: Embedding[],
) {
    const embeddingResults = embeddings.map((embed) => {
        return new TextNode({ text: embed.text, embedding: embed.embedding });
    });
    const indexDict = new IndexDict();
    for (const node of embeddingResults) {
        indexDict.addNode(node);
    }

    const index = await VectorStoreIndex.init({
        indexStruct: indexDict,
        serviceContext: serviceContext,
    });

    await index.vectorStore.add(embeddingResults);
    if (!index.vectorStore.storesText) {
        await index.docStore.addDocuments(embeddingResults, true);
    }
    await index.indexStore?.addIndexStruct(indexDict);
    index.indexStruct = indexDict;
    return index;
}

async function createChatEngine(
    serviceContext: ServiceContext,
    embeddings: Embedding[],
) {
    const index = await createIndex(serviceContext, embeddings);

    const retriever = index!.asRetriever();
    retriever.similarityTopK = 10;

    const contextGenerator = new DefaultContextGenerator({ retriever });
    return new HistoryChatEngine({
        llm: serviceContext.llm,
        contextGenerator,
    });
}

function createReadableStream(
    stream: AsyncGenerator<string, void, unknown>,
    chatHistory: ChatHistory,
) {
    let responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    let aborted = false;
    writer.closed.catch(() => {
        // reader aborted the stream
        aborted = true;
    });
    const encoder = new TextEncoder();
    const onNext = async () => {
        try {
            const { value, done } = await stream.next();
            if (aborted) return;
            if (!done) {
                writer.write(encoder.encode(value));
                onNext();
            } else {
                writer.close();
            }
        } catch (error) {
            console.error("[LlamaIndex]", error);
            writer.write(JSON.stringify(`error: ${(error as Error).message}`));
            writer.close();
        }
    };
    onNext();
    return responseStream.readable;
}


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            messages,
            embeddings,
        } = body;
        const message = body.messages[body.messages.length - 1].content
        const llm = new OpenAI({
            model: "gpt-3.5-turbo",
            temperature: 0.3,
            topP: 0.5,
            maxTokens: 200,
        });

        const serviceContext = serviceContextFromDefaults({
            llm,
            chunkSize: 500,
            chunkOverlap: 20,
        });

        const chatEngine = await createChatEngine(
            serviceContext,
            embeddings,
        );

        const stream = await chatEngine.chat(
            message,
            new SimpleChatHistory({messages}),
            true
        );
        const readableStream = createReadableStream(
            stream,
            new SimpleChatHistory({messages}),
        );
        return new StreamingTextResponse(readableStream)

    } catch (error) {
        console.error("[LlamaIndex]", error);
        return NextResponse.json(
            {
                error: (error as Error).message,
            },
            {
                status: 500,
            },
        );
    }
}
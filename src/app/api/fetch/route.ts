import { NextResponse, NextRequest } from "next/server";
import splitAndEmbed from "./embedding";
import pdf from 'pdf-parse'


type Input = {
    fileName: string;
    content: string;
    docType?: string;
    encoding?: string;
};

async function handleText(
    fileName: string,
    text: string,
) {
    const embeddings = await splitAndEmbed(text);
    return {
        content: text,
        embeddings: embeddings,
        url: fileName,
        size: text.length,
        type: "text/plain",
    };
}

export const getPDFContentFromBuffer = async (pdfBuffer: Buffer) => {
    const data = await pdf(pdfBuffer);
    const content = data.text;
    const size = data.text.length;

    return {
        content,
        size,
        type: "application/pdf",
    };
};

async function handlePDF(
    fileName: string,
    pdf: string,
) {
    const pdfBuffer = Buffer.from(pdf, "base64");
    console.log("pdfBuffer=> ",pdfBuffer)
    const pdfData = await getPDFContentFromBuffer(pdfBuffer);
    const embeddings = await splitAndEmbed(pdfData.content);
    return {
        content: pdfData.content,
        embeddings: embeddings,
        type: "application/pdf",
        url: fileName,
    };
}

export async function POST(request: NextRequest) {
    try {
        const { fileName, content, docType, encoding }: Input = await request.json();
        const json = await handlePDF(fileName, content);
        return NextResponse.json(json);
    } catch (error) {
        console.error("[Fetch]", error);
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
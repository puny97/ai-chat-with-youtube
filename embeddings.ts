import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  batchSize: 512,
  model: "text-embedding-3-small",
});

export const vectorstore = new MemoryVectorStore(embeddings);

export const addYTVideoToVectorStore = async (videoData: {
  transcript?: string;
  video_id: string;
}) => {
  const docs = new Document({
    pageContent: videoData.transcript ?? "",
    metadata: { video_id: videoData.video_id },
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const chunks = await splitter.splitDocuments([docs]);
  await vectorstore.addDocuments(chunks);
};
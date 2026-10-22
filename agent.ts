import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";
import data from "./data.js";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { addYTVideoToVectorStore, vectorstore } from "./embeddings.js";

const video1 = data[0];
const video2 = data[1];
if (!video1) {
  throw new Error("No video data available.");
}

await addYTVideoToVectorStore(video1);
if (video2) {
  await addYTVideoToVectorStore(video2);
}

const checkpointer = new MemorySaver();

const retrievalTool = tool(
  async ({ query }, { configurable: { video_id } }) => {
    const retrievedDocs = await vectorstore.similaritySearch(
      query,
      3,
      (doc) => doc.metadata.video_id === video_id,
    );

    const serializedDocs = retrievedDocs
      .map((doc) => doc.pageContent)
      .join("\n");
    return serializedDocs;
  },
  {
    name: "retrieve",
    description:
      "You MUST call this tool before answering every user request. Pass the user's question as the query. Do not answer until you have retrieved the relevant transcript content.",
    schema: z.object({
      query: z.string(),
    }),
  },
);

const model = new ChatOpenAI({
  model: "gpt-5.5",
});

const agent = createAgent({
  model,
  tools: [retrievalTool],
  checkpointer,
});

const video_id = "bGzmzkX4Kqk";

console.log(
  "Q1: How traditional payment gateway works? (give me a short answer)",
);
const aiMsg = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content:
          "How traditional payment gateway works? (give me a short answer) (get content from transcript)",
      },
    ],
  },
  { configurable: { thread_id: "1", video_id } },
);
console.log(aiMsg.messages.at(-1)?.content);

import { ChatOpenAI } from '@langchain/openai';
import 'dotenv/config';
import data from './data.js';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createAgent } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';
import { addYTVideoToVectorStore, vectorStore } from './embeddings.js';

const video1 = data[0];
const video2 = data[1];

if (!video1) {
  throw new Error('No video data available.');
}

if (!video2) {
  throw new Error('No video data available.');
}

// await addYTVideoToVectorStore(video1);
// await addYTVideoToVectorStore(video2);

const checkpointer = new MemorySaver();

const retrievalTool = tool(
  async ({ query }, { configurable: { video_id } }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 3, {
      video_id,
    });

    const serializedDocs = retrievedDocs
      .map((doc) => doc.pageContent)
      .join('\n');
    return serializedDocs;
  },
  {
    name: 'retrieve',
    description:
      "You MUST call this tool before answering every user request. Pass the user's question as the query. Do not answer until you have retrieved the relevant transcript content.",
    schema: z.object({
      query: z.string(),
    }),
  },
);

const model = new ChatOpenAI({
  model: 'gpt-5.5',
});

export const agent = createAgent({
  model,
  tools: [retrievalTool],
  checkpointer,
});

import { ChatOpenRouter } from "@langchain/openrouter";
import 'dotenv/config'

const model = new ChatOpenRouter({
  model: "nvidia/nemotron-3.5-super-vl:free",
  temperature: 0,
});

const aiMsg = await model.invoke([
  {
    role: "user",
    content: "What is the capital of the moon?",
  },
]);
console.log(aiMsg.content);

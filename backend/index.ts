import express from "express";
import cors from "cors";
import "dotenv/config";
import { agent } from "./agent";

const port = process.env.PORT || 8000;

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/generate", async (req, res) => {
  const { query, video_id, thread_id } = req.body;

  const aiMsg = await agent.invoke(
    {
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
    },
    { configurable: { thread_id, video_id } },
  );

  res.send(aiMsg.messages.at(-1)?.content);
});

app.listen(port, () => {
  console.log("Server running on port 8000");
});

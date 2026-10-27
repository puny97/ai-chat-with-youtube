import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { agent } from './agent.js';
import type data from './data.js';
import { addYTVideoToVectorStore } from './embeddings.js';

type Video = (typeof data)[number];

const app = express();

app.use(express.json());
app.use(cors());

app.listen(process.env.PORT, () => {
  console.log('Server is running on Port:', process.env.PORT);
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/webhook', async (req, res) => {
  await Promise.all(
    req.body.map(async (video: Video) => addYTVideoToVectorStore(video)),
  );

  res.send('OK');
});

app.post(['/api/generate', '/generate'], async (req, res) => {
  const { query, thread_id } = req.body ?? {};

  if (
    typeof query !== 'string' ||
    !query.trim() ||
    query.trim().length > 2000
  ) {
    res
      .status(400)
      .json({ error: 'Enter a question between 1 and 2000 characters.' });
    return;
  }

  if (
    typeof thread_id !== 'string' ||
    !thread_id.trim() ||
    thread_id.length > 128
  ) {
    res.status(400).json({ error: 'A valid conversation thread is required.' });
    return;
  }

  try {
    const aiMsg = await agent.invoke(
      {
        messages: [
          {
            role: 'user',
            content: query.trim(),
          },
        ],
      },
      { configurable: { thread_id } },
    );

    const content = aiMsg.messages.at(-1)?.content;
    const answer =
      typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content
              .map((part) =>
                typeof part === 'string'
                  ? part
                  : typeof part === 'object' &&
                      part !== null &&
                      'text' in part &&
                      typeof part.text === 'string'
                    ? part.text
                    : '',
              )
              .join('')
          : '';

    if (!answer.trim()) {
      res.status(502).json({
        error: 'The assistant did not return an answer. Please try again.',
      });
      return;
    }

    res.json({ answer: answer.trim() });
  } catch (error) {
    console.error('Failed to generate an answer:', error);
    res
      .status(500)
      .json({ error: 'Unable to answer right now. Please try again.' });
  }
});

export default app;

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { agent } from './agent.js';
import data from './data.js';

const port = process.env.PORT || 8000;

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post(['/api/generate', '/generate'], async (req, res) => {
  const { query, video_id, thread_id } = req.body ?? {};

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
    typeof video_id !== 'string' ||
    !data.some((video) => video.video_id === video_id)
  ) {
    res
      .status(400)
      .json({ error: 'Choose a video from the available videos.' });
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
      { configurable: { thread_id, video_id } },
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

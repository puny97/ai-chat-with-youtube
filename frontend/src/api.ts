function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const apiSubmission = async (query: string) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      thread_id: '1',
    }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : 'Your question could not be answered. Please try again.';
    throw new Error(message);
  }
  if (!isRecord(payload) || typeof payload.answer !== 'string') {
    throw new Error('The server returned an empty or invalid answer.');
  }
  const answer = payload.answer.trim();
  if (!answer)
    throw new Error('The server returned an empty or invalid answer.');

  return answer;
};

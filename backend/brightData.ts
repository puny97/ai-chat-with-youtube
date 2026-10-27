import 'dotenv/config';

const brightDataUrl = 'https://api.brightdata.com/datasets/v3/trigger';
const webhookUrl = `${process.env.API_URL}/webhook`;

export const triggerYoutubeVideoScrape = async (url: string) => {
  const data = JSON.stringify({
    input: [{ url, country: '', transcription_language: '' }],
    limit_per_input: null,
  });

  console.log('Webhook url: ', webhookUrl);

  const response = await fetch(
    `${brightDataUrl}?dataset_id=gd_lk56epmy2i5g7lzu0k&endpoint=${webhookUrl}&notify=false&format=json&uncompressed_webhook=true&force_deliver=false&include_errors=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: data,
    },
  );

  console.log('Bright data response: ', response);

  const result = await response.json();

  console.log(result);

  return result.snapshot_id;
};

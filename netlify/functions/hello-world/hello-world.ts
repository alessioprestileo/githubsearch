import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const { name = 'stranger' } = event.queryStringParameters || {};

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello there, ${name}!`,
    }),
  };
};

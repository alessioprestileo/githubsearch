import { Handler } from '@netlify/functions';
import axios from 'axios';

export const handler: Handler = async (event) => {
  const { q, shift: shiftRaw, cursor } = event.queryStringParameters || {};
  if (!q) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The query parameter "q" is required',
      }),
    };
  }
  if (!shiftRaw) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The query parameter "shift" is required',
      }),
    };
  }

  const shift = parseInt(shiftRaw);

  if (isNaN(shift) || shift === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message:
          'The query parameter "shift" be a positive or negative integer different from 0',
      }),
    };
  }
  if (Math.abs(shift) > 100) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message:
          'The query parameter "shift" must comply with -100 < shift < 100',
      }),
    };
  }

  let first: number | undefined;
  let last: number | undefined;
  let before: string | undefined;
  let after: string | undefined;
  if (shift > 0) {
    first = shift;
    after = cursor;
  } else {
    last = Math.abs(shift);
    before = cursor;
  }

  const token = process.env.REACT_APP_GITHUB_TOKEN;
  const data = JSON.stringify({
    query: `
query($q:String!, $first:Int, $last:Int, $before:String, $after:String) {
  search(query: $q, type: USER, first: $first, last: $last, before: $before, after: $after) {
    userCount
    pageInfo {
      endCursor
      startCursor
      hasNextPage
      hasPreviousPage
    }
  }
}
`,
    variables: { q, first: first, last: last, before, after },
  });

  const config = {
    method: 'post',
    url: 'https://api.github.com/graphql',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: data,
  };

  try {
    const { status, statusText, headers, data } = await axios(config);

    return {
      statusCode: 200,
      body: JSON.stringify({
        status,
        statusText,
        headers,
        data: data.data.search,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};

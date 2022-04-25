import { Handler } from '@netlify/functions';
import axios from 'axios';

export const handler: Handler = async (event) => {
  const { q, after } = event.queryStringParameters || {};
  if (!q) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The query parameter q is required',
      }),
    };
  }

  const token = process.env.REACT_APP_GITHUB_TOKEN;
  const data = JSON.stringify({
    query: `
query($q:String!, $after:String) {
  search(query: $q, type: USER, first: 20, after: $after) {
    userCount
    pageInfo {
      endCursor
      startCursor
    }
    edges {
      node {
        ... on User {
          id
          login
          avatarUrl
          bioHTML
          email
          name
          url
          followers {totalCount}
          following {totalCount}
          starredRepositories {totalCount}
        }
      }
    }
  }
}
`,
    variables: { q, after },
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
    const {
      status,
      statusText,
      headers,
      data: {
        data: { search: rawSearch },
      },
    } = await axios(config);
    const { edges, ...restOfRawSearch } = rawSearch;
    const users = edges.map(({ node }: any) => node);
    const data = { users, ...restOfRawSearch };

    return {
      statusCode: 200,
      body: JSON.stringify({ status, statusText, headers, data }),
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

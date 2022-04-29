import { Handler } from '@netlify/functions';
import axios from 'axios';

export const handler: Handler = async (event) => {
  const { q, first, last, before, after } = event.queryStringParameters || {};
  if (!q) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The query parameter "q" is required',
      }),
    };
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
    variables: {
      q,
      first: first && parseInt(first),
      last: last && parseInt(last),
      before,
      after,
    },
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
      headers: responseHeaders,
      data: {
        data: { search: rawSearch },
      },
    } = await axios(config);
    const { edges, ...restOfRawSearch } = rawSearch;
    const users = edges.map(
      ({
        node: { followers, following, starredRepositories, ...restOfUser },
      }: any) => ({
        followers: followers?.totalCount || 0,
        following: following?.totalCount || 0,
        starredRepositories: starredRepositories?.totalCount || 0,
        ...restOfUser,
      })
    );
    const data = { users, ...restOfRawSearch };

    return {
      statusCode: 200,
      body: JSON.stringify({ status, statusText, responseHeaders, data }),
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

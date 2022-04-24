import { Handler } from '@netlify/functions';
import { Octokit } from 'octokit';

export const handler: Handler = async () => {
  const token = process.env.REACT_APP_GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });
  const {
    data: { login },
  } = await octokit.rest.users.getAuthenticated();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, github user ${login}!`,
    }),
  };
};

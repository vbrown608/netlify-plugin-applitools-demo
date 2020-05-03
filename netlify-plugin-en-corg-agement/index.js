const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const gh = require('parse-github-url');

const CACHE_PATH = path.resolve(
  process.cwd(),
  '.netlify-plugin-en-corg-agement-cache',
);
const CORGI_IMG_URL =
  'https://res.cloudinary.com/jlengstorf/image/upload/q_auto,w_50/v1586558217/party-corgi.gif';

module.exports = {
  onPreBuild: async ({ utils }) => {
    console.log({ cwd: process.cwd() });
    if (await utils.cache.restore(CACHE_PATH)) {
      console.log('found a corgi cache');
    } else {
      console.log(`no corgi cache found at ${CACHE_PATH}`);
      utils.run('ls');
      utils.run('mkdir', [CACHE_PATH]);
      utils.run('ls');
    }
  },
  async onPostBuild({ utils }) {
    console.log({ cwd: process.cwd() });
    if (process.env.CONTEXT !== 'deploy-preview' || !process.env.PULL_REQUEST) {
      return;
    }

    if (!process.env.GITHUB_TOKEN) {
      console.log(
        'please add GITHUB_TOKEN with the public_repo scope to your environment',
      );
      return;
    }

    console.log({
      REPOSITORY_URL: process.env.REPOSITORY_URL,
      BRANCH: process.env.BRANCH,
      PULL_REQUEST: process.env.PULL_REQUEST,
      REVIEW_ID: process.env.REVIEW_ID,
    });

    const { owner, name } = gh(process.env.REPOSITORY_URL);
    const apiBase = `https://api.github.com/repos/${owner}/${name}/issues`;

    let apiURL;
    let httpMethod;
    let updateCount;

    try {
      const { commentID, count } = require(CACHE_PATH);

      apiURL = `${apiBase}/comments/${commentID}`;
      httpMethod = 'PATCH';
      updateCount = count + 1;
    } catch (e) {
      apiURL = `${apiBase}/${process.env.REVIEW_ID}/comments`;
      httpMethod = 'POST';
      updateCount = 1;
    }

    const response = await fetch(apiURL, {
      method: httpMethod,
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        body: `
Here’s a little en-_corg_-agement for you: you’re doing a great job! Keep it up!

${Array(updateCount).fill(`![party corgi](${CORGI_IMG_URL})`).join(' ')}
`,
      }),
    })
      .then((res) => res.json())
      .catch((err) => console.error(err));

    console.log(
      JSON.stringify({
        commentID: response.id,
        count: updateCount,
      }),
    );
    fs.writeFileSync(
      CACHE_PATH,
      JSON.stringify({
        commentID: response.id,
        count: updateCount,
      }),
    );
    if (await utils.cache.save(CACHE_PATH)) {
      console.log(`cached corgi details at ${CACHE_PATH}`);
    } else {
      console.log('unable to cache corgi details');
    }

    utils.run('ls', [CACHE_PATH]);
    utils.run('cat', [CACHE_PATH]);
  },
};

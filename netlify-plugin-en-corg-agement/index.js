const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const gh = require('parse-github-url');

const CACHE_FILE = '../../buildhome/.cache/netlify-plugin-en-corg-agement.json';
const CORGI_IMG_URL =
  'https://res.cloudinary.com/jlengstorf/image/upload/q_auto,w_50/v1586558217/party-corgi.gif';

module.exports = {
  async onPostBuild({ utils }) {
    if (process.env.CONTEXT !== 'deploy-preview' || !process.env.PULL_REQUEST) {
      return;
    }

    if (!process.env.GITHUB_TOKEN) {
      console.log('please add GITHUB_TOKEN to your environment');
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
    let updateCount = 1;
    if (await utils.cache.restore(CACHE_FILE)) {
      console.log('found a corgi cache');
      const { commentID, count } = require(CACHE_FILE);

      apiURL = `${apiBase}/comments/${commentID}`;
      httpMethod = 'PATCH';
      updateCount = count;
    } else {
      console.log('no corgi cache found');
      apiURL = `${apiBase}/${process.env.REVIEW_ID}/comments`;
      httpMethod = 'POST';
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

    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({
        commentID: response.id,
        count: updateCount + 1,
      }),
    );
    if (await utils.cache.save(CACHE_FILE)) {
      console.log('cached corgi details');
    } else {
      console.log('unable to cache corgi details');
    }
  },
};

const fetch = require('node-fetch');
const fs = require('fs');
const gh = require('parse-github-url');

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
    if (await utils.cache.restore('.netlify-plugin-high-five-comment')) {
      const commentID = fs.readFileSync(
        '.netlify-plugin-high-five-comment',
        'utf-8',
      );

      apiURL = `${apiBase}/comments/${commentID}`;
      httpMethod = 'PATCH';
    } else {
      apiURL = `${apiBase}/${process.env.REVIEW_ID}/comments`;
      httpMethod = 'POST';
    }
    // const commentID =

    const response = await fetch(apiURL, {
      method: httpMethod,
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        body: `
You’re doing great! This plugin is awesome!

![corgi](https://www.partycorgi.com/party-corgi.gif)

This comment was updated by <code>netlify-plugin-high-five</code>
`,
      }),
    })
      .then((res) => res.json())
      .catch((err) => console.error(err));

    fs.writeFileSync('.netlify-plugin-high-five-comment', response.id);
    await utils.cache.save('.netlify-plugin-high-five-comment');
  },
};

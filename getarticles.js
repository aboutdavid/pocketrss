const Parser = require("rss-parser");
const parser = new Parser();
const fs = require("fs");

function lastMod() {
  try {
    return fs.readFileSync("lastFetched", "utf8");
  } catch (e) {
    return (function(d) {
      d.setDate(d.getDate() - 1);
      return d;
    })(new Date());
  }
}
const request = require("sync-request");
const date = new Date(lastMod());
const { feeds } = require("./config.js");
async function getBlog(url) {
  var feed = await parser.parseURL(url);

  feed.items.forEach((item, index, array) => {
    if (new Date(item.isoDate) < date) {
      var json = request("POST", "https://getpocket.com/v3/add", {
        qs: {
          consumer_key: process.env.POCKET_CONSUMER_KEY,
          access_token: process.env.POCKET_OAUTH_TOKEN,
          url: item.link,
          title: item.title
        },
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "X-Accept": "application/json"
        }
      });
    }
    if (index == array.length) {
      fs.writeFileSync("lastFetched", new Date());
    }
  });
}
feeds.forEach(blog => {
  getBlog(blog);
});

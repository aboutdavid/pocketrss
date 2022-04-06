const express = require("express");
const app = express();
const request = require("sync-request");
const cookieParser = require("cookie-parser");
const config = require("./config.js");
app.use(cookieParser());
if (!process.env.DOMAIN) {
  console.error("Please set a domain! Please see the README.md for more info.");
  process.exit(1);
}
if (!process.env.POCKET_CONSUMER_KEY) {
  console.error(
    "Please set your pocket consumer key! Please see the README.md for more info."
  );
  process.exit(1);
}
if (!process.env.POCKET_OAUTH_TOKEN) {
  console.log(
    "It looks like you have not set your client token. Please see the README.md for more info."
  );
} else {
  require("./getarticles.js");
  setInterval(function() {
    require("./getarticles.js");
  }, 900000);
}
app.get("/", (req, res) => {
  res.redirect("https://github.com/aboutDavid/pocketrss")
});
app.get("/getoAuthToken", (req, res) => {
  var json = request("POST", "https://getpocket.com/v3/oauth/request", {
    qs: {
      consumer_key: process.env.POCKET_CONSUMER_KEY,
      redirect_uri: "pocketapp1234:authorizationFinished"
    },
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Accept": "application/json"
    }
  });
  var key = JSON.parse(json.getBody("utf8")).code;

  res.cookie("tempcode", key);
  res.redirect(
    `https://getpocket.com/auth/authorize?request_token=${key}&redirect_uri=${encodeURIComponent(
      `https://${process.env.DOMAIN}/callback`
    )}`
  );
});
app.get("/callback", (req, res) => {
  if (req.cookies.tempcode) {
    var json = request("POST", "https://getpocket.com/v3/oauth/authorize", {
      qs: {
        consumer_key: process.env.POCKET_CONSUMER_KEY,
        code: req.cookies.tempcode
      },
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Accept": "application/json"
      }
    });
    json = JSON.parse(json.getBody("utf8"));

    console.log(json);
    res.set("Content-Type", "text/html");
    res.write(
      `Please go into your .env file and set "POCKET_OAUTH_TOKEN" to <code>${json.access_token}</code>`
    );
    res.clearCookie("tempcode");
    res.end();
  } else {
    res.redirect("/getoAuthToken");
  }
});
const listener = app.listen(config.port || process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

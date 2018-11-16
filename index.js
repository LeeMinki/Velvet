'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const urlRegex = require('url-regex');
const exec = require('child_process').exec;


// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
      // ignore non-text-message event
      return Promise.resolve(null);
  }
  let child;
  let res_text;
  const check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

  //라인으로 받은 메시지
  console.log(event.message.text);
  // url 요약
  if (urlRegex({exact: true, strict: false}).test(event.message.text)) {
      if (event.message.text.substring(0, 4) !== "http") {
          event.message.text = "http://" + event.message.text;
      }
      child = exec("sumy lex-rank --length=10 --url=" + event.message.text, (error, stdout, stderr) => {
          console.log('stdout: ' + stdout);
          console.log('stderr: ' + stderr);
          if (error !== null) {
              console.log('exec error: ' + error);
          }
          res_text = stdout;

          // text 요약
      });
  } else {
      // 한글일 경우
      if (check.test(event.message.text.substring(0, 10))) {
          console.log("한글 요약 들어오니")
          child = exec("sumy lex-rank --length=3 --language=korean --text=" + '"' + event.message.text + '"', (error, stdout, stderr) => {
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
              if (error !== null) {
                  console.log('exec error: ' + error);
              }
              res_text = stdout;
          });
      }
      // 한글 아니면 영어로 처리
      else {
          child = exec("sumy lex-rank --length=3 --language=en --text=" + '"' + event.message.text + '"', (error, stdout, stderr) => {
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
              if (error !== null) {
                  console.log('exec error: ' + error);
              }
              res_text = stdout;
          });
      }
  }
  // create a echoing text message
  const ret_msg = { type: 'text', text: res_text };

  // use reply API
  return client.replyMessage(event.replyToken, ret_msg);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
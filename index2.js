'use strict';

const express = require('express');
const app = express();
const exec = require('child_process').exec;
const algor_select= ["luhn" , "edmundson ", "lsa", "text-rank", "lex-rank", "sum-basic", "kl"];
let algorithm = "text-rank";
let length = "3";
let response;
const check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

// if (check.test(event.message.text.substring(0, 100))) {
app.use(express.json());

app.get('/summary', (req, res) => {
  console.log("This is Get");
});
app.post('/summary', (req, res) => {
   console.log('post!');
   let inputData = req.body;
   let text = inputData['text'];
   length = inputData['number'];
   console.log(text);

   // text 요약
   if(text.length <= 500) {
      response = "Need more text sizes"
      res.statusStatus(200).send(response);
   } else {
     // 한글일 경우
     if(check.test(text.substring(0,100))) {
       console.log("한글 요약" + text);
       exec("sumy " + algorithm + " --length=" + length + " --language=korean --text=" + '"' + text + '"', (error, stdout, stderr) => {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        response = stdout;
        res.sendStatus(200).send(response);
    });
     }
     // 영어일 경우
     else {
      exec("sumy " + algorithm + " --length=" + length + " --language=en --text=" + '"' + text + '"', (error, stdout, stderr) => {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        response = stdout;
        res.sendStatus(200).send(response);
    });
     }
   }
});

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
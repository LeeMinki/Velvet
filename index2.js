'use strict';

const express = require('express');
const app = express();
const exec = require('child_process').exec;
const algor_select= ["luhn" , "edmundson ", "lsa", "text-rank", "lex-rank", "sum-basic", "kl"];
let algorithm = "text-rank";
let length = "3";
let response;
const check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
const regExp = /[^(\(\)\{\}\[\]\/?.,;:|*~`!^\-_+<>@\#$%&\\\=\(\'ㄱ-ㅎ|ㅏ-ㅣ|가-힣|A-Za-z|\s|\n|\r)]/gi;

app.use(express.json());

app.get('/summary', (req, res) => {
  console.log("This is Get");
});
app.post('/summary', (req, res) => {
   let inputData = req.body;
   let text = inputData['text'];
   length = inputData['number'];
   algorithm = inputData['algorithm'];
   console.log(algorithm);

   // text 요약
   if(text.length <= 500) {
      response = "Need more text sizes"
      res.status(200).send(response);
   } else {
     // 잡문자 제거
     // 큰 따옴표를 작은 따옴표로
     text = text.replace(regExp, '');
    //  text = text.replace(/\"/gi, "'");
    //  text = text.replace(/\“/gi, "'");
    //  text = text.replace(/\”/gi, "'");

     // 한글일 경우
     if(check.test(text.substring(0,100))) {
      //  console.log("한글 요약" + text);
       exec("sumy " + algorithm + " --length=" + length + " --language=korean --text=" + '"' + text + '"', (error, stdout, stderr) => {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        response = stdout;
        res.writeHead(200, {"Content-Type":"text/plian"});
        res.write(response);
        res.end();
        // res.set({'content-type': 'text/html'});
        // res.status(200).send(response);
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
        res.writeHead(200, {"Content-Type":"text/plian"});
        res.write(response);
        res.end();
        // res.set({'content-type': 'text/html'});
        // res.status(200).send(response);
    });
     }
   }
});

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
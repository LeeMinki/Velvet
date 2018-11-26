'use strict';

const line = require('@line/bot-sdk');
const path = require('path');
const express = require('express');
const urlRegex = require('url-regex');
const exec = require('child_process').exec;
const filePath = path.join(__dirname, 'pdf/text.pdf')
const extract = require('pdf-text-extract');
const fs = require('fs');

const algor_select= ["luhn" , "edmundson ", "lsa", "text-rank", "lex-rank", "sum-basic", "kl"];
let algorithm = "lex-rank";
let length = "10";


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
    if (event.type !== 'message' || (event.message.type !== 'text' && event.message.type !== 'file')) {
        // ignore non-text-message event, file event
        return Promise.resolve(null);
    }

    let res_text;

    const check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    // file event(pdf)

    if (event.message.type === 'file') {
        console.log("lovebombombombom");
        const pdfStream = fs.createWriteStream(filePath);
        client.getMessageContent(event.message.id)
            .then((stream) => {
                stream.on('data', (chunk) => {
                    pdfStream.write(chunk);
                }).on('end', () => {
                    // 파일 저장했으니 pdf 추출
                    console.log("lovebombombombomdddaaa");
                    extract(filePath, {splitPages: false}, (err, text) => {
                        if (err) {
                            console.dir(err);
                            return;
                        }
                        // 추출한 text로 text 요약
                        console.log(text.length);
                        let texts = '';
                        for(let i in text) {
                            texts += text[i];
                        }
                        texts = texts.replace(/\"/gi, "'");
                        // text 요약
                        // 한글일 경우
                        if (check.test(texts.substring(5, 10))) {
                            console.log("한글 요약 들어오니");
                            exec("sumy " + algorithm + " --length=" + length + " --language=korean --text=" + '"' + texts + '"', (error, stdout, stderr) => {
                                console.log('stdout: ' + stdout);
                                console.log('stderr: ' + stderr);
                                if (error !== null) {
                                    console.log('exec error: ' + error);
                                }
                                res_text = stdout;
                                // create a echoing text message
                                let ret_msg = {type: 'text', text: res_text};
                                return client.replyMessage(event.replyToken, ret_msg);
                            });
                        }
                        // 한글 아니면 영어로 처리
                        else {
                            exec("sumy " + algorithm + " --length=" + length + " --language=en --text=" + '"' + texts + '"', (error, stdout, stderr) => {
                                console.log('stdout: ' + stdout);
                                console.log('stderr: ' + stderr);
                                if (error !== null) {
                                    console.log('exec error: ' + error);
                                }
                                res_text = stdout;
                                // create a echoing text message
                                let ret_msg = {type: 'text', text: res_text};
                                return client.replyMessage(event.replyToken, ret_msg);
                            });
                        }
                    })
                });
                stream.on('error', (err) => {
                    console.log(err);
                });
            });
    }

    // text event
    else {
        // 큰 따옴표를 작은 따옴표로
        // for (let i in event.message.text) {
        //     if(event.message.text[i] === '"')
        //         event.message.text[i] = "'";
        // }
        event.message.text = event.message.text.replace(/\"/gi, "'");

        //라인으로 받은 메시지
        console.log(event.message.text);
        // 업데이트 명령어 확인
        if (event.message.text.substring(0, 1) === "!") {
            if (event.message.text.substring(1, 5) === "help") {
                res_text = "algorithm=luhn, edmundson, lsa, text-rank, lex-rank, sum-basic, kl \n\nlength={number}";
                // create a echoing text message
                let ret_msg = {type: 'text', text: res_text};
                return client.replyMessage(event.replyToken, ret_msg);
            }
            if (event.message.text.substring(1, 7) === "update") {
                exec("cd /home/ubuntu/sumy&&git pull&&python3 setup.py install", (error, stdout, stderr) => {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                    res_text = "업데이트 완료";
                    // create a echoing text message
                    let ret_msg = {type: 'text', text: res_text};
                    return client.replyMessage(event.replyToken, ret_msg);
                });
            } else if (event.message.text.substring(1, 11) === "algorithm=") {
                for (let i in algor_select) {
                    if (algor_select[i] === event.message.text.substring(11)) {
                        algorithm = algor_select[i];
                    }
                }
            } else if (event.message.text.substring(1, 8) === "length=") {
                length = event.message.text.substring(8);
            }
        }
        // url 요약
        else if (urlRegex({exact: true, strict: false}).test(event.message.text)) {
            if (event.message.text.substring(0, 4) !== "http") {
                event.message.text = "http://" + event.message.text;
            }
            exec("sumy " + algorithm + " --length=" + length + " --url=" + event.message.text, (error, stdout, stderr) => {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                    console.log('exec error: ' + error);
                }
                res_text = stdout;
                // create a echoing text message
                let ret_msg = {type: 'text', text: res_text};
                return client.replyMessage(event.replyToken, ret_msg);

            });
        } else {
            // text 요약
            if (event.message.text.length <= 500) {
                res_text = "500자 이상 입력하세요!";
                let ret_msg = {type: 'text', text: res_text};
                return client.replyMessage(event.replyToken, ret_msg);
            }
            // 한글일 경우
            else if (check.test(event.message.text.substring(0, 10))) {
                console.log("한글 요약 들어오니");
                exec("sumy " + algorithm + " --length=" + length + " --language=korean --text=" + '"' + event.message.text + '"', (error, stdout, stderr) => {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                    res_text = stdout;
                    // create a echoing text message
                    let ret_msg = {type: 'text', text: res_text};
                    return client.replyMessage(event.replyToken, ret_msg);
                });
            }
            // 한글 아니면 영어로 처리
            else {
                exec("sumy " + algorithm + " --length=" + length + " --language=en --text=" + '"' + event.message.text + '"', (error, stdout, stderr) => {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                    res_text = stdout;
                    // create a echoing text message
                    let ret_msg = {type: 'text', text: res_text};
                    return client.replyMessage(event.replyToken, ret_msg);
                });
            }
        }
    }
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
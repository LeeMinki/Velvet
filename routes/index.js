const express = require('express');
const router = express.Router();
const line = require('@line/bot-sdk');
// bash 실행용
const exec = require('child_process').exec;
// URL 입력확인 용
const urlRegex = require('url-regex');

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end('<h1>Velvet<h1>');
});

router.post('/', (req, res, next) => {
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end('<h1>녹용<h1>');
});

router.get('/callback', (req, res) => {
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end(`I'm listening.`);
});

// register a webhook handler with middleware
// about the middleware, please refer to doc
router.post('/callback', line.middleware(config), (req, res) => {
    // req.body.events should be an array of events
    if (!Array.isArray(req.body.events)) {
        console.log("왜 500뜨냐 여기냐11");
        return res.status(500).end();
    }
    console.log("보이루");
    // handle events separately
    Promise.all(req.body.events.map(handleEvent))
        .then(() => res.end())
        .catch((err) => {
            console.error(err);
            console.log("왜 500뜨냐 여기냐12222");
            res.status(500).end();
        });
});


// simple reply function
const replyText = (token, texts) => {
    texts = Array.isArray(texts) ? texts : [texts];
    return client.replyMessage(
        token,
        texts.map((text) => ({type: 'text', text}))
    );
};

// callback function to handle a single event
function handleEvent(event) {
    if (event.replyToken.match(/^(.)\1*$/)) {
        return console.log("Recieved: " + JSON.stringify(event.message));
    }

    switch (event.type) {
        case 'message':
            const message = event.message;
            switch (message.type) {
                case 'text':
                    return handleText(message, event.replyToken, event.source);
                // case 'image':
                //     return handleImage(message, event.replyToken);
                // case 'video':
                //     return handleVideo(message, event.replyToken);
                // case 'audio':
                //     return handleAudio(message, event.replyToken);
                // case 'location':
                //     return handleLocation(message, event.replyToken);
                // case 'sticker':
                //     return handleSticker(message, event.replyToken);
                default:
                    throw new Error(`Unknown message: ${JSON.stringify(message)}`);
            }

        case 'follow':
            return replyText(event.replyToken, 'Got followed event');

        case 'unfollow':
            return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

        case 'join':
            return replyText(event.replyToken, `Joined ${event.source.type}`);

        case 'leave':
            return console.log(`Left: ${JSON.stringify(event)}`);

        case 'postback':
            let data = event.postback.data;
            if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
                data += `(${JSON.stringify(event.postback.params)})`;
            }
            return replyText(event.replyToken, `Got postback: ${data}`);

        case 'beacon':
            return replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);

        default:
            throw new Error(`Unknown event: ${JSON.stringify(event)}`);
    }
}

function handleText(message, replyToken, source) {
    switch (message.text) {
        case 'bye':
            switch (source.type) {
                case 'user':
                    return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
                case 'group':
                    return replyText(replyToken, 'Leaving group')
                        .then(() => client.leaveGroup(source.groupId));
                case 'room':
                    return replyText(replyToken, 'Leaving room')
                        .then(() => client.leaveRoom(source.roomId));
            }
        default:
            // -----------------------------여기서부터가 시작이군...---------------------------------------------------------
            let child;
            const check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

            //라인으로 받은 메시지
            console.log(message.text);
            // url 요약
            if (urlRegex({exact: true, strict: false}).test(message.text)) {
                if (message.text.substring(0, 4) !== "http") {
                    message.text = "http://" + message.text;
                }
                child = exec("sumy lex-rank --length=10 --url=" + message.text, (error, stdout, stderr) => {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                    message.text = stdout;

                    // text 요약
                });
            } else {
                // 한글일 경우
                if (check.test(message.text.substring(0, 10))) {
                    console.log("한글 요약 들어오니")
                    child = exec("sumy lex-rank --length=3 --language=korean --text=" + '"' + _obj.content + '"', (error, stdout, stderr) => {
                        console.log('stdout: ' + stdout);
                        console.log('stderr: ' + stderr);
                        if (error !== null) {
                            console.log('exec error: ' + error);
                        }
                        message.text = stdout;
                    });
                }
                // 한글 아니면 영어로 처리
                else {
                    child = exec("sumy lex-rank --length=3 --language=en --text=" + '"' + message.text + '"', (error, stdout, stderr) => {
                        console.log('stdout: ' + stdout);
                        console.log('stderr: ' + stderr);
                        if (error !== null) {
                            console.log('exec error: ' + error);
                        }
                        message.text = stdout;
                    });
                }
            }
    }
    return replyText(replyToken, message.text);
}

module.exports = router;
const express = require('express');
const router = express.Router();
// bash 실행용
const exec = require('child_process').exec;
// URL 입력확인 용
const urlRegex = require('url-regex');


/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'Express' });
});

router.get('/keyboard', (req, res )=> {
    // 전달할 데이터
    const data = {
        'type': 'text',
        'text': '요약을 원하는 URL 입력하셈!'
    };

    // JSON 형식으로 응답
    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify(data));
});

//카톡 메시지 처리
router.post('/message',(req, res) => {
    let child;
    const check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    let _obj = {
        user_key: req.body.user_key,
        type: req.body.type,
        content: req.body.content
    };

    //카톡으로 받은 메시지
    console.log(_obj.content);
    if (_obj.type === 'text')  {
        // url 요약
        if(urlRegex({exact: true, strict: false}).test(_obj.content)) {
            if (_obj.content.substring(0, 4) !== "http") {
                _obj.content = "http://" + _obj.content;
            }
            child = exec("sumy lex-rank --length=10 --url=" + _obj.content, (error, stdout, stderr) => {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                    console.log('exec error: ' + error);
                }

                let massage = {
                    "message": {
                        "text": stdout
                    }
                }
                console.log(massage);
                res.set({
                    'content-type': 'application/json'
                }).send(JSON.stringify(massage));
            });

            // text 요약
        } else {
            // 한글일 경우
            if(check.test(_obj.content.substring(0, 10))) {
                console.log("한글 요약 들어오니")
                child = exec("sumy lex-rank --length=3 --language=korean --text=" + '"' + _obj.content + '"', (error, stdout, stderr) => {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }

                    let massage = {
                        "message": {
                            "text": stdout
                        }
                    }
                    console.log(massage);
                    res.set({
                        'content-type': 'application/json'
                    }).send(JSON.stringify(massage));
                });
            }
            // 한글 아니면 영어로 처리
            else {
                child = exec("sumy lex-rank --length=3 --language=en --text=" + '"' + _obj.content + '"', (error, stdout, stderr) => {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }

                    let massage = {
                        "message": {
                            "text": stdout
                        }
                    }
                    console.log(massage);
                    res.set({
                        'content-type': 'application/json'
                    }).send(JSON.stringify(massage));
                });
            }
        }
    }
});
module.exports = router;
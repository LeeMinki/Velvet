const express = require('express');
const router = express.Router();
// bash 실행용
const exec = require('child_process').exec;

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'Express' });
});

router.get('/keyboard', (req, res )=> {
    // 전달할 데이터
    const data = {
        'type': 'buttons',
        'buttons': ['녹용!']
    };

    // JSON 형식으로 응답
    res.json(data);
});

//카톡 메시지 처리
router.post('/message',(req, res) => {
    let child;

    let _obj = {
        user_key: req.body.user_key,
        type: req.body.type,
        content: req.body.content
    };

    //카톡으로 받은 메시지
    console.log(_obj.content);
    if (_obj.type === 'text') {

        child = exec("sumy lex-rank --length=10 --url=" + _obj.content, (error, stdout, stderr) => {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }

            let massage = {
                "message": {
                    "text": stdout + stderr
                }
            }
            console.log(massage);
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify(massage));
        });
    }
});
module.exports = router;
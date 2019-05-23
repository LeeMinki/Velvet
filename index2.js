'use strict';

const express = require('express');
const app = express();
const exec = require('child_process').exec;

app.use(express.json());

app.get('/summary', (req, res) => {
  console.log("This is Get");
});
app.post('/summary', (req, res) => {
   console.log('post!');
   let inputData = req.body;
   console.log(inputData);
   res.json("TEST!");
   res.status(200).end();
});

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
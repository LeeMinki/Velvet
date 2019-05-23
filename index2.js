const express = require('express');
const app = express();

app.post('/summary', (req, res) => {
   console.log('who get in here post /users');
   let inputData;

   req.on('data', (data) => {
     inputData = JSON.parse(data);
     console.log(inputData);
   });

   req.on('end', () => {
     console.log("Finish");
   });
   res.json(200, "TEST!");
   res.end();
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
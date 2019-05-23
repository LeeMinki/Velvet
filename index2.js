const express = require('express');
const app = express();

app.get('/users', (req, res) => {
   console.log('Conenct');
});

app.post('/post', (req, res) => {
   console.log('who get in here post /users');
   var inputData;

   req.on('data', (data) => {
     inputData = JSON.parse(data);
     console.log(inputData);
   });

   req.on('end', () => {
     console.log("Finish");
   });

   res.write("TEST!");
   res.end();
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
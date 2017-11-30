const express = require('express');
const fetchData = require('./fetchData');

const app = express();

const PORT = process.env.PORT || 3000;

const sendResultsAsJson = response => result => response.json(result);

app.get('/', (req, res) => {
  fetchData(sendResultsAsJson(res));
});

app.listen(PORT, () => {
  console.log('Pasx API listening on port 3000');
});


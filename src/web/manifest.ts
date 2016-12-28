import * as express from 'express';

const app = express.Router();
app.get('/manifest.json', (req, res) => res.sendFile(__dirname + '/../../resources/manifest.json'));

module.exports = app;

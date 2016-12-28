import * as path from 'path';
import * as express from 'express';

const app = express.Router();
app.get('/apple-touch-icon.png', (req, res) =>
	res.sendFile(path.resolve(__dirname + '/../../resources/apple-touch-icon.png')));

module.exports = app;

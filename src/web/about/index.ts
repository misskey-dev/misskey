import * as express from 'express';
import ms = require('ms');

const router = express.Router();

router.use('/@/about/assets', express.static(`${__dirname}/assets`, {
	maxAge: ms('7 days')
}));

router.get('/@/about/', (req, res) => {
	res.sendFile(`${__dirname}/pages/index.html`);
});

router.get('/@/about/:page(*)', (req, res) => {
	res.sendFile(`${__dirname}/pages/${req.params.page}.html`);
});

module.exports = router;

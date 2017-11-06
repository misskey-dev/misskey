/**
 * File Server
 */

import * as fs from 'fs';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as mongodb from 'mongodb';
import * as gm from 'gm';

import DriveFile, { getGridFSBucket } from '../api/models/drive-file';

/**
 * Init app
 */
const app = express();

app.disable('x-powered-by');
app.locals.cache = true;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

/**
 * Statics
 */
app.use('/assets', express.static(`${__dirname}/assets`, {
	maxAge: 1000 * 60 * 60 * 24 * 365 // 一年
}));

app.get('/', (req, res) => {
	res.send('yee haw');
});

app.get('/default-avatar.jpg', (req, res) => {
	const file = fs.readFileSync(`${__dirname}/assets/avatar.jpg`);
	send(file, 'image/jpeg', req, res);
});

app.get('/app-default.jpg', (req, res) => {
	const file = fs.readFileSync(`${__dirname}/assets/dummy.png`);
	send(file, 'image/png', req, res);
});

async function raw(data: Buffer, type: string, download: boolean, res: express.Response): Promise<any> {
	res.header('Content-Type', type);

	if (download) {
		res.header('Content-Disposition', 'attachment');
	}

	res.send(data);
}

async function thumbnail(data: Buffer, type: string, resize: number, res: express.Response): Promise<any> {
	if (!/^image\/.*$/.test(type)) {
		data = fs.readFileSync(`${__dirname}/assets/dummy.png`);
	}

	let g = gm(data);

	if (resize) {
		g = g.resize(resize, resize);
	}

	g
		.compress('jpeg')
		.quality(80)
		.toBuffer('jpeg', (err, img) => {
			if (err !== undefined && err !== null) {
				console.error(err);
				res.sendStatus(500);
				return;
			}

			res.header('Content-Type', 'image/jpeg');
			res.send(img);
		});
}

function send(data: Buffer, type: string, req: express.Request, res: express.Response): void {
	if (req.query.thumbnail !== undefined) {
		thumbnail(data, type, req.query.size, res);
	} else {
		raw(data, type, req.query.download !== undefined, res);
	}
}

/**
 * Routing
 */

app.get('/:id', async (req, res) => {
	// Validate id
	if (!mongodb.ObjectID.isValid(req.params.id)) {
		res.status(400).send('incorrect id');
		return;
	}

	const fileId = new mongodb.ObjectID(req.params.id)
	const file = await DriveFile.findOne({ _id: fileId });

	if (file == null) {
		res.status(404).sendFile(`${__dirname}/assets/dummy.png`);
		return;
	}

	const bucket = await getGridFSBucket()

	const buffer = await ((id): Promise<Buffer> => new Promise((resolve, reject) => {
		const chunks = []
		const readableStream = bucket.openDownloadStream(id)
	  readableStream.on('data', chunk => {
			chunks.push(chunk);
		})
		readableStream.on('end', () => {
			resolve(Buffer.concat(chunks))
		})
	}))(fileId)

	send(buffer, file.metadata.type, req, res);
});

app.get('/:id/:name', async (req, res) => {
	// Validate id
	if (!mongodb.ObjectID.isValid(req.params.id)) {
		res.status(400).send('incorrect id');
		return;
	}

	const fileId = new mongodb.ObjectID(req.params.id)
	const file = await DriveFile.findOne({ _id: fileId });

	if (file == null) {
		res.status(404).sendFile(`${__dirname}/assets/dummy.png`);
		return;
	}

	const bucket = await getGridFSBucket()

	const buffer = await ((id): Promise<Buffer> => new Promise((resolve, reject) => {
		const chunks = []
		const readableStream = bucket.openDownloadStream(id)
	  readableStream.on('data', chunk => {
			chunks.push(chunk);
		})
		readableStream.on('end', () => {
			resolve(Buffer.concat(chunks))
		})
	}))(fileId)

	send(buffer, file.metadata.type, req, res);
});

module.exports = app;

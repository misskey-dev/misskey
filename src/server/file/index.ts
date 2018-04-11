/**
 * File Server
 */

import * as fs from 'fs';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as mongodb from 'mongodb';
import * as _gm from 'gm';
import * as stream from 'stream';

import DriveFile, { getGridFSBucket } from '../../models/drive-file';

const gm = _gm.subClass({
	imageMagick: true
});

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
	const file = fs.createReadStream(`${__dirname}/assets/avatar.jpg`);
	send(file, 'image/jpeg', req, res);
});

app.get('/app-default.jpg', (req, res) => {
	const file = fs.createReadStream(`${__dirname}/assets/dummy.png`);
	send(file, 'image/png', req, res);
});

interface ISend {
	contentType: string;
	stream: stream.Readable;
}

function thumbnail(data: stream.Readable, type: string, resize: number): ISend {
	const readable: stream.Readable = (() => {
		// 動画であれば
		if (/^video\/.*$/.test(type)) {
			// 実装は先延ばし
			// 使わないことになったストリームはしっかり取り壊す
			data.destroy();
			return fs.createReadStream(`${__dirname}/assets/thumbnail-not-available.png`);
		// 画像であれば
		} else if (/^image\/.*$/.test(type) || type == 'application/xml') {
			// 0フレーム目を送る
			try {
				return gm(data).selectFrame(0).stream();
			// だめだったら
			} catch (e) {
				// 使わないことになったストリームはしっかり取り壊す
				data.destroy();
				return fs.createReadStream(`${__dirname}/assets/thumbnail-not-available.png`);
			}
		// 動画か画像以外
		} else {
			data.destroy();
			return fs.createReadStream(`${__dirname}/assets/not-an-image.png`);
		}
	})();

	let g = gm(readable);

	if (resize) {
		g = g.resize(resize, resize);
	}

	const stream = g
		.compress('jpeg')
		.quality(80)
		.interlace('line')
		.stream();

	return {
		contentType: 'image/jpeg',
		stream
	};
}

const commonReadableHandlerGenerator = (req: express.Request, res: express.Response) => (e: Error): void => {
	console.dir(e);
	req.destroy();
	res.destroy(e);
};

function send(readable: stream.Readable, type: string, req: express.Request, res: express.Response): void {
	readable.on('error', commonReadableHandlerGenerator(req, res));

	const data = ((): ISend => {
		if (req.query.thumbnail !== undefined) {
			return thumbnail(readable, type, req.query.size);
		}
		return {
			contentType: type,
			stream: readable
		};
	})();

	if (readable !== data.stream) {
		data.stream.on('error', commonReadableHandlerGenerator(req, res));
	}

	if (req.query.download !== undefined) {
		res.header('Content-Disposition', 'attachment');
	}

	res.header('Content-Type', data.contentType);

	data.stream.pipe(res);

	data.stream.on('end', () => {
		res.end();
	});
}

async function sendFileById(req: express.Request, res: express.Response): Promise<void> {
	// Validate id
	if (!mongodb.ObjectID.isValid(req.params.id)) {
		res.status(400).send('incorrect id');
		return;
	}

	const fileId = new mongodb.ObjectID(req.params.id);

	// Fetch (drive) file
	const file = await DriveFile.findOne({ _id: fileId });

	// validate name
	if (req.params.name !== undefined && req.params.name !== file.filename) {
		res.status(404).send('there is no file has given name');
		return;
	}

	if (file == null) {
		res.status(404).sendFile(`${__dirname}/assets/dummy.png`);
		return;
	}

	const bucket = await getGridFSBucket();

	const readable = bucket.openDownloadStream(fileId);

	send(readable, file.contentType, req, res);
}

/**
 * Routing
 */

app.get('/:id', sendFileById);
app.get('/:id/:name', sendFileById);

module.exports = app;

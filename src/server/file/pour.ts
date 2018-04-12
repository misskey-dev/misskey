import * as fs from 'fs';
import * as stream from 'stream';
import * as Koa from 'koa';
import * as Gm from 'gm';

const gm = Gm.subClass({
	imageMagick: true
});

interface ISend {
	contentType: string;
	stream: stream.Readable;
}

function thumbnail(data: stream.Readable, type: string, resize: number): ISend {
	const readable: stream.Readable = (() => {
		// 動画であれば
		if (/^video\/.*$/.test(type)) {
			// TODO
			// 使わないことになったストリームはしっかり取り壊す
			data.destroy();
			return fs.createReadStream(`${__dirname}/assets/thumbnail-not-available.png`);
		// 画像であれば
		// Note: SVGはapplication/xml
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

const commonReadableHandlerGenerator = (ctx: Koa.Context) => (e: Error): void => {
	console.error(e);
	ctx.status = 500;
};

export default function(readable: stream.Readable, type: string, ctx: Koa.Context): void {
	readable.on('error', commonReadableHandlerGenerator(ctx));

	const data = ((): ISend => {
		if (ctx.query.thumbnail !== undefined) {
			return thumbnail(readable, type, ctx.query.size);
		}
		return {
			contentType: type,
			stream: readable
		};
	})();

	if (readable !== data.stream) {
		data.stream.on('error', commonReadableHandlerGenerator(ctx));
	}

	if (ctx.query.download !== undefined) {
		ctx.set('Content-Disposition', 'attachment');
	}

	ctx.set('Cache-Control', 'max-age=31536000, immutable');
	ctx.set('Content-Type', data.contentType);

	data.stream.pipe(ctx.res);

	data.stream.on('end', () => {
		ctx.res.end();
	});
}

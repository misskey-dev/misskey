import * as assert from 'assert';
import { async } from './utils';
import { getFileInfo } from '../src/misc/get-file-info';

describe('Get file info', () => {
	it('Empty file', async (async () => {
		const path = `${__dirname}/resources/emptyfile`;
		const info = await getFileInfo(path) as any;
		delete info.warnings;
		delete info.blurhash;
		assert.deepStrictEqual(info, {
			size: 0,
			md5: 'd41d8cd98f00b204e9800998ecf8427e',
			type: {
				mime: 'application/octet-stream',
				ext: null
			},
			width: undefined,
			height: undefined,
		});
	}));

	it('Generic JPEG', async (async () => {
		const path = `${__dirname}/resources/Lenna.jpg`;
		const info = await getFileInfo(path) as any;
		delete info.warnings;
		delete info.blurhash;
		assert.deepStrictEqual(info, {
			size: 25360,
			md5: '091b3f259662aa31e2ffef4519951168',
			type: {
				mime: 'image/jpeg',
				ext: 'jpg'
			},
			width: 512,
			height: 512,
		});
	}));

	it('Generic APNG', async (async () => {
		const path = `${__dirname}/resources/anime.png`;
		const info = await getFileInfo(path) as any;
		delete info.warnings;
		delete info.blurhash;
		assert.deepStrictEqual(info, {
			size: 1868,
			md5: '08189c607bea3b952704676bb3c979e0',
			type: {
				mime: 'image/apng',
				ext: 'apng'
			},
			width: 256,
			height: 256,
		});
	}));

	it('Generic AGIF', async (async () => {
		const path = `${__dirname}/resources/anime.gif`;
		const info = await getFileInfo(path) as any;
		delete info.warnings;
		delete info.blurhash;
		assert.deepStrictEqual(info, {
			size: 2248,
			md5: '32c47a11555675d9267aee1a86571e7e',
			type: {
				mime: 'image/gif',
				ext: 'gif'
			},
			width: 256,
			height: 256,
		});
	}));

	it('PNG with alpha', async (async () => {
		const path = `${__dirname}/resources/with-alpha.png`;
		const info = await getFileInfo(path) as any;
		delete info.warnings;
		delete info.blurhash;
		assert.deepStrictEqual(info, {
			size: 3772,
			md5: 'f73535c3e1e27508885b69b10cf6e991',
			type: {
				mime: 'image/png',
				ext: 'png'
			},
			width: 256,
			height: 256,
		});
	}));

	it('Generic SVG', async (async () => {
		const path = `${__dirname}/resources/image.svg`;
		const info = await getFileInfo(path) as any;
		delete info.warnings;
		delete info.blurhash;
		assert.deepStrictEqual(info, {
			size: 505,
			md5: 'b6f52b4b021e7b92cdd04509c7267965',
			type: {
				mime: 'image/svg+xml',
				ext: 'svg'
			},
			width: 256,
			height: 256,
		});
	}));

	it('SVG with XML definition', async (async () => {
		// https://github.com/misskey-dev/misskey/issues/4413
		const path = `${__dirname}/resources/with-xml-def.svg`;
		const info = await getFileInfo(path) as any;
		delete info.warnings;
		delete info.blurhash;
		assert.deepStrictEqual(info, {
			size: 544,
			md5: '4b7a346cde9ccbeb267e812567e33397',
			type: {
				mime: 'image/svg+xml',
				ext: 'svg'
			},
			width: 256,
			height: 256,
		});
	}));

	it('Dimension limit', async (async () => {
		const path = `${__dirname}/resources/25000x25000.png`;
		const info = await getFileInfo(path) as any;
		delete info.warnings;
		delete info.blurhash;
		assert.deepStrictEqual(info, {
			size: 75933,
			md5: '268c5dde99e17cf8fe09f1ab3f97df56',
			type: {
				mime: 'application/octet-stream',	// do not treat as image
				ext: null
			},
			width: 25000,
			height: 25000,
		});
	}));
});

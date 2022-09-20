process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { FileInfoService } from '@/core/FileInfoService.js';
import { DI } from '@/di-symbols.js';
import { AiService } from '@/core/AiService.js';
import type { TestingModule } from '@nestjs/testing';
import type { jest } from '@jest/globals';
import type { MockFunctionMetadata } from 'jest-mock';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const resources = `${_dirname}/../resources`;

const moduleMocker = new ModuleMocker(global);

describe('FileInfoService', () => {
	let app: TestingModule;
	let fileInfoService: FileInfoService;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				AiService,
				FileInfoService,
			],
		})
			.useMocker((token) => {
				//if (token === AiService) {
				//	return {  };
				//}
				if (typeof token === 'function') {
					const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
					const Mock = moduleMocker.generateFromMetadata(mockMetadata);
					return new Mock();
				}
			})
			.compile();

		app.enableShutdownHooks();

		fileInfoService = app.get<FileInfoService>(FileInfoService);
	});

	afterAll(async () => {
		await app.close();
	});

	it('Empty file', async () => {
		const path = `${resources}/emptyfile`;
		const info = await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }) as any;
		delete info.warnings;
		delete info.blurhash;
		delete info.sensitive;
		delete info.porn;
		assert.deepStrictEqual(info, {
			size: 0,
			md5: 'd41d8cd98f00b204e9800998ecf8427e',
			type: {
				mime: 'application/octet-stream',
				ext: null,
			},
			width: undefined,
			height: undefined,
			orientation: undefined,
		});
	});

	it('Generic JPEG', async () => {
		const path = `${resources}/Lenna.jpg`;
		const info = await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }) as any;
		delete info.warnings;
		delete info.blurhash;
		delete info.sensitive;
		delete info.porn;
		assert.deepStrictEqual(info, {
			size: 25360,
			md5: '091b3f259662aa31e2ffef4519951168',
			type: {
				mime: 'image/jpeg',
				ext: 'jpg',
			},
			width: 512,
			height: 512,
			orientation: undefined,
		});
	});

	it('Generic APNG', async () => {
		const path = `${resources}/anime.png`;
		const info = await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }) as any;
		delete info.warnings;
		delete info.blurhash;
		delete info.sensitive;
		delete info.porn;
		assert.deepStrictEqual(info, {
			size: 1868,
			md5: '08189c607bea3b952704676bb3c979e0',
			type: {
				mime: 'image/apng',
				ext: 'apng',
			},
			width: 256,
			height: 256,
			orientation: undefined,
		});
	});

	it('Generic AGIF', async () => {
		const path = `${resources}/anime.gif`;
		const info = await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }) as any;
		delete info.warnings;
		delete info.blurhash;
		delete info.sensitive;
		delete info.porn;
		assert.deepStrictEqual(info, {
			size: 2248,
			md5: '32c47a11555675d9267aee1a86571e7e',
			type: {
				mime: 'image/gif',
				ext: 'gif',
			},
			width: 256,
			height: 256,
			orientation: undefined,
		});
	});

	it('PNG with alpha', async () => {
		const path = `${resources}/with-alpha.png`;
		const info = await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }) as any;
		delete info.warnings;
		delete info.blurhash;
		delete info.sensitive;
		delete info.porn;
		assert.deepStrictEqual(info, {
			size: 3772,
			md5: 'f73535c3e1e27508885b69b10cf6e991',
			type: {
				mime: 'image/png',
				ext: 'png',
			},
			width: 256,
			height: 256,
			orientation: undefined,
		});
	});

	it('Generic SVG', async () => {
		const path = `${resources}/image.svg`;
		const info = await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }) as any;
		delete info.warnings;
		delete info.blurhash;
		delete info.sensitive;
		delete info.porn;
		assert.deepStrictEqual(info, {
			size: 505,
			md5: 'b6f52b4b021e7b92cdd04509c7267965',
			type: {
				mime: 'image/svg+xml',
				ext: 'svg',
			},
			width: 256,
			height: 256,
			orientation: undefined,
		});
	});

	it('SVG with XML definition', async () => {
		// https://github.com/misskey-dev/misskey/issues/4413
		const path = `${resources}/with-xml-def.svg`;
		const info = await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }) as any;
		delete info.warnings;
		delete info.blurhash;
		delete info.sensitive;
		delete info.porn;
		assert.deepStrictEqual(info, {
			size: 544,
			md5: '4b7a346cde9ccbeb267e812567e33397',
			type: {
				mime: 'image/svg+xml',
				ext: 'svg',
			},
			width: 256,
			height: 256,
			orientation: undefined,
		});
	});

	it('Dimension limit', async () => {
		const path = `${resources}/25000x25000.png`;
		const info = await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }) as any;
		delete info.warnings;
		delete info.blurhash;
		delete info.sensitive;
		delete info.porn;
		assert.deepStrictEqual(info, {
			size: 75933,
			md5: '268c5dde99e17cf8fe09f1ab3f97df56',
			type: {
				mime: 'application/octet-stream',	// do not treat as image
				ext: null,
			},
			width: 25000,
			height: 25000,
			orientation: undefined,
		});
	});

	it('Rotate JPEG', async () => {
		const path = `${resources}/rotate.jpg`;
		const info = await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }) as any;
		delete info.warnings;
		delete info.blurhash;
		delete info.sensitive;
		delete info.porn;
		assert.deepStrictEqual(info, {
			size: 12624,
			md5: '68d5b2d8d1d1acbbce99203e3ec3857e',
			type: {
				mime: 'image/jpeg',
				ext: 'jpg',
			},
			width: 512,
			height: 256,
			orientation: 8,
		});
	});
});

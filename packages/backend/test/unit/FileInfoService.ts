/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import { GlobalModule } from '@/GlobalModule.js';
import { FileInfo, FileInfoService } from '@/core/FileInfoService.js';
//import { DI } from '@/di-symbols.js';
import { AiService } from '@/core/AiService.js';
import { LoggerService } from '@/core/LoggerService.js';
import type { TestingModule } from '@nestjs/testing';
import type { MockFunctionMetadata } from 'jest-mock';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const resources = `${_dirname}/../resources`;

const moduleMocker = new ModuleMocker(global);

describe('FileInfoService', () => {
	let app: TestingModule;
	let fileInfoService: FileInfoService;
	const strip = (fileInfo: FileInfo): Omit<Partial<FileInfo>, 'warnings' | 'blurhash' | 'sensitive' | 'porn'> => {
		const fi: Partial<FileInfo> = fileInfo;
		delete fi.warnings;
		delete fi.sensitive;
		delete fi.blurhash;
		delete fi.porn;
		
		return fi;
	}

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				AiService,
				LoggerService,
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

	test('Empty file', async () => {
		const path = `${resources}/emptyfile`;
		const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
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

	describe('IMAGE', () => {
		test('Generic JPEG', async () => {
			const path = `${resources}/192.jpg`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
			assert.deepStrictEqual(info, {
				size: 5131,
				md5: '8c9ed0677dd2b8f9f7472c3af247e5e3',
				type: {
					mime: 'image/jpeg',
					ext: 'jpg',
				},
				width: 192,
				height: 192,
				orientation: undefined,
			});
		});

		test('Generic APNG', async () => {
			const path = `${resources}/anime.png`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
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

		test('Generic AGIF', async () => {
			const path = `${resources}/anime.gif`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
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

		test('PNG with alpha', async () => {
			const path = `${resources}/with-alpha.png`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
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

		test('Generic SVG', async () => {
			const path = `${resources}/image.svg`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
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

		test('SVG with XML definition', async () => {
			// https://github.com/misskey-dev/misskey/issues/4413
			const path = `${resources}/with-xml-def.svg`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
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

		test('Dimension limit', async () => {
			const path = `${resources}/25000x25000.png`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
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

		test('Rotate JPEG', async () => {
			const path = `${resources}/rotate.jpg`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
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

	describe('AUDIO', () => {
		test('MP3', async () => {
			const path = `${resources}/kick_gaba7.mp3`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
			delete info.width;
			delete info.height;
			delete info.orientation;
			assert.deepStrictEqual(info, {
				size: 19853,
				md5: '4f557df8548bc3cecc794c652f690446',
				type: {
					mime: 'audio/mpeg',
					ext: 'mp3',
				},
			});
		});

		test('WAV', async () => {
			const path = `${resources}/kick_gaba7.wav`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
			delete info.width;
			delete info.height;
			delete info.orientation;
			assert.deepStrictEqual(info, {
				size: 87630,
				md5: '8bc9bb4fe5e77bb1871448209be635c1',
				type: {
					mime: 'audio/wav',
					ext: 'wav',
				},
			});
		});

		test('AAC', async () => {
			const path = `${resources}/kick_gaba7.aac`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
			delete info.width;
			delete info.height;
			delete info.orientation;
			assert.deepStrictEqual(info, {
				size: 7291,
				md5: '2789323f05e3392b648066f50be6a2a6',
				type: {
					mime: 'audio/aac',
					ext: 'aac',
				},
			});
		});

		test('FLAC', async () => {
			const path = `${resources}/kick_gaba7.flac`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
			delete info.width;
			delete info.height;
			delete info.orientation;
			assert.deepStrictEqual(info, {
				size: 108793,
				md5: 'bc0f3adfe0e1ca99ae6c7528c46b3173',
				type: {
					mime: 'audio/flac',
					ext: 'flac',
				},
			});
		});

		test('MPEG-4 AUDIO (M4A)', async () => {
			const path = `${resources}/kick_gaba7.m4a`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
			delete info.width;
			delete info.height;
			delete info.orientation;
			assert.deepStrictEqual(info, {
				size: 9817,
				md5: '74c9279a4abe98789565f1dc1a541a42',
				type: {
					mime: 'audio/mp4',
					ext: 'm4a',
				},
			});
		});

		test('WEBM AUDIO', async () => {
			const path = `${resources}/kick_gaba7.webm`;
			const info = strip(await fileInfoService.getFileInfo(path, { skipSensitiveDetection: true }));
			delete info.width;
			delete info.height;
			delete info.orientation;
			assert.deepStrictEqual(info, {
				size: 8879,
				md5: '53bc1adcb6acbbda67ff9bd484896438',
				type: {
					mime: 'audio/webm',
					ext: 'webm',
				},
			});
		});
	});
});

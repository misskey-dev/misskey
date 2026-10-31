/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { generateVideoThumbnail, hasVideoTrack } from '../../src/video.js';
import { createTempDir } from '../utils.js';

// ffmpeg / ffprobe が必要 (CI では apt でインストールする)
describe('video', () => {
	let dir: string;
	let cleanup: () => Promise<void>;
	let videoPath: string;
	let audioPath: string;

	beforeAll(async () => {
		const temp = await createTempDir();
		dir = temp.dir;
		cleanup = temp.cleanup;

		videoPath = path.join(dir, 'video.mp4');
		audioPath = path.join(dir, 'audio.m4a');

		const ffmpeg = promisify(execFile);
		await ffmpeg('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=1280x720:rate=10', '-pix_fmt', 'yuv420p', videoPath]);
		await ffmpeg('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=duration=1', audioPath]);
	}, 30000);

	afterAll(async () => {
		await cleanup();
	});

	describe(generateVideoThumbnail, () => {
		test('498x422 に収まる WebP のサムネイルを生成する', async () => {
			const image = await generateVideoThumbnail(videoPath);
			const metadata = await sharp(image.data).metadata();

			expect(image.type).toBe('image/webp');
			expect(image.ext).toBe('webp');
			expect(metadata.format).toBe('webp');
			expect(metadata.width).toBe(498);
			expect(metadata.height).toBe(280);
		});
	});

	describe(hasVideoTrack, () => {
		test('映像トラックがあれば true', async () => {
			expect(await hasVideoTrack(videoPath)).toBe(true);
		});

		test('音声のみなら false', async () => {
			expect(await hasVideoTrack(audioPath)).toBe(false);
		});

		test('判定できないファイルは true として扱い、警告を出す', async () => {
			const warnings: string[] = [];
			const result = await hasVideoTrack(path.join(dir, 'not-found.mp4'), {
				info: () => {},
				warn: (message) => warnings.push(message),
			});

			expect(result).toBe(true);
			expect(warnings).toHaveLength(1);
		});
	});
});

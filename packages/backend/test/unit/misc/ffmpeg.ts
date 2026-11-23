/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
	FFmpegError,
	buildDetectionFramesArgs,
	buildThumbnailArgs,
	extractDetectionFrames,
	extractVideoThumbnail,
	hasVideoStream,
	probeDuration,
} from '@/misc/ffmpeg.js';
import { createTempDir } from '@/misc/create-temp.js';

const resources = join(dirname(fileURLToPath(import.meta.url)), '../../resources');

describe('misc:ffmpeg', () => {
	describe('引数の組み立て', () => {
		// fluent-ffmpeg 2.1.3 が組み立てていた引数と同じ内容であることを確認する
		test('センシティブ判定用フレームの書き出し', () => {
			expect(buildDetectionFramesArgs('/in/video.mp4', '/out')).toEqual([
				'-skip_frame', 'nokey',
				'-lowres', '3',
				'-i', '/in/video.mp4',
				'-y',
				'-an',
				'-filter:v', 'select=e=\'eq(pict_type,PICT_TYPE_I)\',blackframe=amount=0,metadata=mode=select:key=lavfi.blackframe.pblack:value=50:function=less,scale=w=299:h=299',
				'-f', 'image2',
				'-vsync', '0',
				'/out/%d.png',
			]);
		});

		test('サムネイルの書き出し', () => {
			expect(buildThumbnailArgs('/in/video.mp4', 0.5, '/out/out.png')).toEqual([
				'-ss', '0.5',
				'-i', '/in/video.mp4',
				'-frames:v', '1',
				'-y',
				'/out/out.png',
			]);
		});
	});

	describe('ffmpeg の実行', () => {
		let dir: string;
		let cleanup: () => void;
		let video: string;

		beforeAll(async () => {
			[dir, cleanup] = await createTempDir();
			video = join(dir, 'video.mp4');
			// 10 秒・30fps・1 秒ごとにキーフレームを持つテスト動画を生成する
			const result = spawnSync('ffmpeg', [
				'-hide_banner', '-loglevel', 'error', '-y',
				'-f', 'lavfi', '-i', 'testsrc=duration=10:size=320x240:rate=30',
				'-c:v', 'mpeg4', '-g', '30',
				video,
			]);
			if (result.status !== 0) {
				throw new Error(`failed to generate test video: ${result.stderr.toString()}`);
			}
		});

		afterAll(() => {
			cleanup();
		});

		test('動画の長さを取得できる', async () => {
			const duration = await probeDuration(video);
			expect(duration).not.toBeNull();
			expect(duration).toBeCloseTo(10, 0);
		});

		test('映像ストリームの有無を判定できる', async () => {
			expect(await hasVideoStream(video)).toBe(true);
			expect(await hasVideoStream(join(resources, 'kick_gaba7.webm'))).toBe(false);
		});

		test('サムネイルを 1 枚書き出せる', async () => {
			const out = join(dir, 'thumbnail.png');
			await extractVideoThumbnail(video, out);
			expect((await fs.stat(out)).size).toBeGreaterThan(0);
		});

		test('キーフレームを連番で書き出せる', async () => {
			const outDir = join(dir, 'frames');
			await fs.mkdir(outDir);
			await extractDetectionFrames(video, outDir);
			const files = await fs.readdir(outDir);
			expect(files).toContain('1.png');
			expect(files.length).toBeGreaterThanOrEqual(2);
		});

		test('動画でないファイルを渡すと FFmpegError で失敗する', async () => {
			const notVideo = join(dir, 'not-video.mp4');
			await fs.writeFile(notVideo, 'this is not a video');
			await expect(extractVideoThumbnail(notVideo, join(dir, 'never.png'))).rejects.toBeInstanceOf(FFmpegError);
		});
	});
});

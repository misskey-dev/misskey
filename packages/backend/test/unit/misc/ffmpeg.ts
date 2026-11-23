/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import {
	FFmpegError,
	buildDetectionFramesArgs,
	buildThumbnailArgs,
	extractDetectionFrames,
	extractVideoThumbnail,
	hasVideoStream,
	probeVideoStream,
	resolveBinary,
} from '@/misc/ffmpeg.js';
import { createTempDir } from '@/misc/create-temp.js';

const resources = join(dirname(fileURLToPath(import.meta.url)), '../../resources');

/** テスト用の ffmpeg を同期実行し、失敗したら原因が分かる形で投げる */
function ffmpegSync(args: string[]): Buffer {
	const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', ...args], { timeout: 60 * 1000 });
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`ffmpeg failed: ${result.stderr.toString()}`);
	return result.stdout;
}

/** 画像をデコードした画素列（PNG のエンコード差に影響されない比較用） */
function decodePixels(path: string): Buffer {
	return ffmpegSync(['-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
}

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
			expect(buildThumbnailArgs('/in/video.mp4', 0, 0.5, '/out/out.png')).toEqual([
				'-ss', '0.5',
				'-i', '/in/video.mp4',
				'-map', '0:0',
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
		let longAudioVideo: string;

		beforeAll(async () => {
			[dir, cleanup] = await createTempDir();
			// 10 秒・30fps・1 秒ごとにキーフレームを持つテスト動画
			video = join(dir, 'video.mp4');
			ffmpegSync(['-y', '-f', 'lavfi', '-i', 'testsrc=duration=10:size=320x240:rate=30', '-c:v', 'mpeg4', '-g', '30', video]);
			// 映像は 1 秒、音声は 40 秒（コンテナの長さは音声に引きずられて 40 秒になる）
			longAudioVideo = join(dir, 'long-audio.mp4');
			ffmpegSync([
				'-y',
				'-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=30',
				'-f', 'lavfi', '-i', 'sine=duration=40',
				'-map', '0:v', '-map', '1:a', '-c:v', 'mpeg4', '-c:a', 'aac',
				longAudioVideo,
			]);
		});

		afterAll(() => {
			cleanup();
		});

		/** 160x120 の動画に、それより大きい 640x360 のカバーアートを付けた mp4 を作る */
		async function makeCoverArtVideo(): Promise<string> {
			const cover = join(dir, 'cover.jpg');
			ffmpegSync(['-y', '-f', 'lavfi', '-i', 'color=c=red:size=640x360', '-frames:v', '1', cover]);
			const out = join(dir, 'cover-art.mp4');
			ffmpegSync([
				'-y',
				'-f', 'lavfi', '-i', 'testsrc=duration=2:size=160x120:rate=30',
				'-i', cover,
				'-map', '0:v', '-map', '1:v', '-c:v:0', 'mpeg4', '-c:v:1', 'copy', '-disposition:v:1', 'attached_pic',
				out,
			]);
			return out;
		}

		afterEach(() => {
			vi.unstubAllEnvs();
		});

		test('映像ストリームの長さを取得できる', async () => {
			const stream = await probeVideoStream(video);
			expect(stream?.index).toBe(0);
			expect(stream?.duration).toBeCloseTo(10, 0);
		});

		test('音声のほうが長くても映像ストリーム自身の長さを返す', async () => {
			const stream = await probeVideoStream(longAudioVideo);
			expect(stream?.duration).toBeCloseTo(1, 0);
		});

		test('カバーアートのほうが大きくても動画のストリームを選ぶ', async () => {
			const video = await makeCoverArtVideo();
			const stream = await probeVideoStream(video);
			expect(stream?.index).toBe(0);

			const out = join(dir, 'cover-art.png');
			await extractVideoThumbnail(video, out);
			const size = ffmpegSync(['-i', out, '-f', 'rawvideo', '-pix_fmt', 'gray', '-']).length;
			expect(size).toBe(160 * 120);
		});

		test('映像ストリームの有無を判定できる', async () => {
			expect(await hasVideoStream(video)).toBe(true);
			expect(await hasVideoStream(join(resources, 'kick_gaba7.webm'))).toBe(false);
			expect(await probeVideoStream(join(resources, 'kick_gaba7.webm'))).toBeNull();
		});

		test('長さの 5% の位置のフレームをサムネイルにする', async () => {
			const out = join(dir, 'thumbnail.png');
			await extractVideoThumbnail(video, out);
			const expected = join(dir, 'expected.png');
			ffmpegSync(['-y', '-ss', '0.5', '-i', video, '-frames:v', '1', expected]);
			expect(decodePixels(out).equals(decodePixels(expected))).toBe(true);
		});

		test('音声のほうが長い動画でもサムネイルを書き出せる', async () => {
			const out = join(dir, 'long-audio.png');
			await extractVideoThumbnail(longAudioVideo, out);
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

		describe('バイナリの指定', () => {
			async function writeFakeBinary(name: string, body: string): Promise<string> {
				const path = join(dir, name);
				await fs.writeFile(path, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
				return path;
			}

			test('FFMPEG_PATH / FFPROBE_PATH のバイナリを使う', async () => {
				const fakeFfmpeg = await writeFakeBinary('fake-ffmpeg', 'exit 3');
				const fakeFfprobe = await writeFakeBinary('fake-ffprobe', 'exit 4');
				vi.stubEnv('FFMPEG_PATH', fakeFfmpeg);
				vi.stubEnv('FFPROBE_PATH', fakeFfprobe);
				expect(resolveBinary('ffmpeg')).toBe(fakeFfmpeg);
				expect(resolveBinary('ffprobe')).toBe(fakeFfprobe);
				await expect(extractDetectionFrames(video, dir)).rejects.toMatchObject({ command: 'ffmpeg', exitCode: 3 });
				await expect(hasVideoStream(video)).rejects.toMatchObject({ command: 'ffprobe', exitCode: 4 });
			});

			test('環境変数のパスが存在しなければ PATH から探す', () => {
				vi.stubEnv('FFMPEG_PATH', join(dir, 'does-not-exist'));
				expect(resolveBinary('ffmpeg')).toBe('ffmpeg');
			});

			test('存在しない FFMPEG_PATH の隣にある ffprobe は使わない', async () => {
				const binDir = join(dir, 'missing-ffmpeg-bin');
				await fs.mkdir(binDir);
				await writeFakeBinary('missing-ffmpeg-bin/ffprobe', 'exit 0');
				vi.stubEnv('FFMPEG_PATH', join(binDir, 'ffmpeg'));
				vi.stubEnv('PATH', join(dir, 'empty'));
				expect(resolveBinary('ffprobe')).toBe('ffprobe');
			});

			test('相対パスの FFMPEG_PATH でも隣の ffprobe を絶対パスで返す', async () => {
				const binDir = join(dir, 'relative-bin');
				await fs.mkdir(binDir);
				const fakeFfmpeg = await writeFakeBinary('relative-bin/ffmpeg', 'exit 0');
				const fakeFfprobe = await writeFakeBinary('relative-bin/ffprobe', 'exit 0');
				vi.stubEnv('FFMPEG_PATH', relative(process.cwd(), fakeFfmpeg));
				vi.stubEnv('PATH', join(dir, 'empty'));
				expect(resolveBinary('ffmpeg')).toBe(fakeFfmpeg);
				expect(resolveBinary('ffprobe')).toBe(fakeFfprobe);
			});

			test('ffprobe が PATH になければ FFMPEG_PATH と同じディレクトリを探す', async () => {
				const binDir = join(dir, 'bin');
				await fs.mkdir(binDir);
				const fakeFfmpeg = await writeFakeBinary('bin/ffmpeg', 'exit 0');
				const fakeFfprobe = await writeFakeBinary('bin/ffprobe', 'exit 0');
				vi.stubEnv('FFMPEG_PATH', fakeFfmpeg);
				vi.stubEnv('PATH', join(dir, 'empty'));
				expect(resolveBinary('ffprobe')).toBe(fakeFfprobe);
			});

			test('時間内に終わらなければ止めて FFmpegError で失敗する', async () => {
				vi.stubEnv('FFMPEG_PATH', await writeFakeBinary('slow-ffmpeg', 'exec sleep 30'));
				const startedAt = Date.now();
				await expect(extractDetectionFrames(video, dir, { timeout: 200 })).rejects.toMatchObject({ timedOut: true });
				expect(Date.now() - startedAt).toBeLessThan(5 * 1000);
			});

			test('孫プロセスがパイプを握ったままでもタイムアウトで打ち切る', async () => {
				// 本体は SIGTERM で終了するが、バックグラウンドの sleep が stdout / stderr を握り続ける
				vi.stubEnv('FFMPEG_PATH', await writeFakeBinary('wrapper-ffmpeg', 'sleep 10 &\nexec sleep 30'));
				const startedAt = Date.now();
				await expect(extractDetectionFrames(video, dir, { timeout: 200 })).rejects.toMatchObject({ timedOut: true });
				expect(Date.now() - startedAt).toBeLessThan(5 * 1000);
			});
		});
	});
});

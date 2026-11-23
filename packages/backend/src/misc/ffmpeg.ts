/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { spawn } from 'node:child_process';
import { join } from 'node:path';

/**
 * Misskey が使う ffmpeg / ffprobe の呼び出しだけを用途ごとの関数として提供する。
 * 汎用のコマンドビルダーにはしない（必要になった呼び出しを都度ここに足す）。
 */

/** エラーメッセージに含める stderr の最大文字数（末尾を残す） */
const STDERR_LIMIT = 4096;

/** 共通オプション（バナーと進捗表示を抑え、エラーだけを stderr に出す）。-nostdin は ffmpeg にしかない */
const COMMON_ARGS = {
	ffmpeg: ['-hide_banner', '-loglevel', 'error', '-nostdin'],
	ffprobe: ['-hide_banner', '-loglevel', 'error'],
} as const satisfies Record<string, readonly string[]>;

export class FFmpegError extends Error {
	constructor(
		public readonly command: string,
		public readonly exitCode: number | null,
		public readonly signal: NodeJS.Signals | null,
		public readonly stderr: string,
	) {
		super(`${command} exited with ${exitCode != null ? `code ${exitCode}` : `signal ${signal}`}: ${stderr.trim()}`);
		this.name = 'FFmpegError';
	}
}

/**
 * コマンドを起動し、正常終了したら stdout を返す。
 * 0 以外で終了したら FFmpegError、起動自体に失敗したら（ENOENT など）spawn のエラーで reject する。
 */
function run(command: keyof typeof COMMON_ARGS, args: readonly string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		// シェルを経由せず引数配列で渡すので、パスに含まれる文字がシェルに解釈されることはない
		const child = spawn(command, [...COMMON_ARGS[command], ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
		const stdout: Buffer[] = [];
		let stderr = '';
		child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
		child.stderr.setEncoding('utf8');
		child.stderr.on('data', (chunk: string) => {
			stderr = (stderr + chunk).slice(-STDERR_LIMIT);
		});
		child.once('error', reject);
		child.once('close', (code, signal) => {
			if (code === 0) {
				resolve(Buffer.concat(stdout).toString('utf8'));
			} else {
				reject(new FFmpegError(command, code, signal, stderr));
			}
		});
	});
}

/**
 * 動画の長さ（秒）を返す。コンテナに長さの情報がない場合は null。
 */
export async function probeDuration(source: string): Promise<number | null> {
	const out = await run('ffprobe', [
		'-show_entries', 'format=duration',
		'-of', 'default=noprint_wrappers=1:nokey=1',
		source,
	]);
	const duration = Number.parseFloat(out.trim());
	return Number.isFinite(duration) && duration >= 0 ? duration : null;
}

/**
 * 映像ストリームを 1 つ以上含むかどうかを返す。
 * 音声ファイルのカバーアートのような静止画ストリームも映像ストリームとして数える。
 */
export async function hasVideoStream(source: string): Promise<boolean> {
	const out = await run('ffprobe', [
		'-select_streams', 'v',
		'-show_entries', 'stream=codec_type',
		'-of', 'csv=p=0',
		source,
	]);
	return out.trim() !== '';
}

export function buildThumbnailArgs(source: string, seekSeconds: number, outPath: string): string[] {
	return [
		'-ss', String(seekSeconds), // 入力側でシークする（デコード量が減る）
		'-i', source,
		'-frames:v', '1',
		'-y',
		outPath, // 出力形式は拡張子から決まる
	];
}

/**
 * 動画の長さの 5% の位置のフレームを 1 枚書き出す。
 * 長さが分からない動画では先頭のフレームを使う。
 */
export async function extractVideoThumbnail(source: string, outPath: string): Promise<void> {
	const duration = await probeDuration(source);
	const seekSeconds = duration != null ? duration * 0.05 : 0;
	await run('ffmpeg', buildThumbnailArgs(source, seekSeconds, outPath));
}

export function buildDetectionFramesArgs(source: string, outDir: string): string[] {
	const filters = [
		// I-Frame のみをフィルタする（VP9 とかはデコードしてみないとわからないっぽい）
		// 値に含まれる `,` がフィルタの区切りと解釈されないよう、クォートで囲む
		'select=e=\'eq(pict_type,PICT_TYPE_I)\'',
		// 暗いフレームの検出。暗さに関わらず全てのフレームで測定値を取る
		'blackframe=amount=0',
		// フレームにおける暗部の百分率（前のフィルタからのメタデータを参照する）が
		// 50% 未満のフレームを選択する（50% 以上暗部があるフレームだと誤検知を招くかもしれないので）
		'metadata=mode=select:key=lavfi.blackframe.pblack:value=50:function=less',
		'scale=w=299:h=299',
	];
	return [
		'-skip_frame', 'nokey', // 可能ならキーフレームのみを取得してほしいとする（そうなるとは限らない）
		'-lowres', '3', // 元の画質でデコードする必要はないので 1/8 画質でデコードしてもよいとする（そうなるとは限らない）
		'-i', source,
		'-y',
		'-an',
		'-filter:v', filters.join(','),
		'-f', 'image2',
		'-vsync', '0', // 可変フレームレートにすることで穴埋めをさせない
		join(outDir, '%d.png'),
	];
}

/**
 * センシティブ判定に使うフレームを outDir に 1.png, 2.png, ... として書き出す。
 * 返る Promise は ffmpeg の終了で settle するので、書き出し中のフレームを並行して読み進められる。
 */
export function extractDetectionFrames(source: string, outDir: string): Promise<void> {
	return run('ffmpeg', buildDetectionFramesArgs(source, outDir)).then(() => undefined);
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { spawn } from 'node:child_process';
import { delimiter, dirname, join, resolve } from 'node:path';

/**
 * Misskey が使う ffmpeg / ffprobe の呼び出しだけを用途ごとの関数として提供する。
 * 汎用のコマンドビルダーにはしない（必要になった呼び出しを都度ここに足す）。
 */

type Command = 'ffmpeg' | 'ffprobe';

/** エラーメッセージに含める stderr の最大文字数（末尾を残す） */
const STDERR_LIMIT = 4096;

/** 共通オプション（バナーと進捗表示を抑え、エラーだけを stderr に出す）。-nostdin は ffmpeg にしかない */
const COMMON_ARGS = {
	ffmpeg: ['-hide_banner', '-loglevel', 'error', '-nostdin'],
	ffprobe: ['-hide_banner', '-loglevel', 'error'],
} as const satisfies Record<Command, readonly string[]>;

/** 実行時間の上限（ミリ秒）の既定値 */
const DEFAULT_TIMEOUT = {
	probe: 30 * 1000,
	thumbnail: 60 * 1000,
	detectionFrames: 5 * 60 * 1000,
} as const;

/** タイムアウトで SIGTERM を送ってから、終了しなければ SIGKILL を送るまでの猶予（ミリ秒） */
const KILL_GRACE = 5 * 1000;

export type FFmpegRunOptions = {
	/** 実行時間の上限（ミリ秒）。超えたらプロセスを止めて FFmpegError で失敗する */
	timeout?: number;
};

export class FFmpegError extends Error {
	public readonly command: string;
	public readonly exitCode: number | null;
	public readonly signal: NodeJS.Signals | null;
	public readonly timedOut: boolean;
	public readonly stderr: string;

	constructor(opts: { command: string; exitCode: number | null; signal: NodeJS.Signals | null; timedOut: boolean; stderr: string }) {
		const reason = opts.timedOut
			? 'timed out'
			: `exited with ${opts.exitCode != null ? `code ${opts.exitCode}` : `signal ${opts.signal}`}`;
		super(`${opts.command} ${reason}: ${opts.stderr.trim()}`);
		this.name = 'FFmpegError';
		this.command = opts.command;
		this.exitCode = opts.exitCode;
		this.signal = opts.signal;
		this.timedOut = opts.timedOut;
		this.stderr = opts.stderr;
	}
}

function isExecutableFile(path: string): boolean {
	try {
		fs.accessSync(path, fs.constants.X_OK);
		return fs.statSync(path).isFile();
	} catch {
		return false;
	}
}

function findInPath(name: string): string | null {
	const exts = process.platform === 'win32' ? ['.exe', ''] : [''];
	for (const dir of (process.env.PATH ?? '').split(delimiter)) {
		if (dir === '') continue;
		for (const ext of exts) {
			const candidate = join(dir, name + ext);
			if (isExecutableFile(candidate)) return candidate;
		}
	}
	return null;
}

/** 環境変数で指定されたパスが実行可能ファイルなら、その絶対パスを返す */
function resolveEnvPath(envPath: string | undefined): string | null {
	if (envPath == null || envPath === '' || !isExecutableFile(envPath)) return null;
	return resolve(envPath);
}

/**
 * 起動するバイナリを決める。fluent-ffmpeg と同じく環境変数 FFMPEG_PATH / FFPROBE_PATH を優先し、
 * 指定がないかパスが存在しなければ PATH から探す。
 * ffprobe が PATH にもなければ、FFMPEG_PATH で指定された ffmpeg と同じディレクトリを探す。
 */
export function resolveBinary(command: Command): string {
	if (command === 'ffmpeg') {
		return resolveEnvPath(process.env.FFMPEG_PATH) ?? 'ffmpeg';
	}

	const ffprobePath = resolveEnvPath(process.env.FFPROBE_PATH);
	if (ffprobePath != null) return ffprobePath;
	if (findInPath('ffprobe') != null) return 'ffprobe';

	const ffmpegPath = resolveEnvPath(process.env.FFMPEG_PATH);
	if (ffmpegPath != null) {
		const sibling = join(dirname(ffmpegPath), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
		if (isExecutableFile(sibling)) return sibling;
	}
	return 'ffprobe';
}

/**
 * コマンドを起動し、正常終了したら stdout を返す。
 * 0 以外での終了とタイムアウトは FFmpegError、起動自体の失敗（ENOENT など）は spawn のエラーで reject する。
 */
function run(command: Command, args: readonly string[], timeout: number): Promise<string> {
	return new Promise((resolvePromise, reject) => {
		// シェルを経由せず引数配列で渡すので、パスに含まれる文字がシェルに解釈されることはない
		const child = spawn(resolveBinary(command), [...COMMON_ARGS[command], ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
		const stdout: Buffer[] = [];
		let stderr = '';
		let timedOut = false;
		let settled = false;
		let killTimer: NodeJS.Timeout | null = null;

		const settle = (result: { stdout: string } | { error: Error }) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeoutTimer);
			if (killTimer != null) clearTimeout(killTimer);
			if ('error' in result) {
				reject(result.error);
			} else {
				resolvePromise(result.stdout);
			}
		};

		const timeoutTimer = setTimeout(() => {
			timedOut = true;
			child.kill('SIGTERM');
			killTimer = setTimeout(() => child.kill('SIGKILL'), KILL_GRACE);
		}, timeout);

		child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
		child.stderr.setEncoding('utf8');
		child.stderr.on('data', (chunk: string) => {
			stderr = (stderr + chunk).slice(-STDERR_LIMIT);
		});
		child.once('error', (error) => settle({ error }));
		child.once('exit', (exitCode, signal) => {
			// 通常は出力ファイルの書き込みまで終わったことを保証するため close を待つ。
			// ただしタイムアウト時は、孫プロセスがパイプを握ったままでも待ち続けないよう、ここで打ち切る
			if (!timedOut) return;
			child.stdout.destroy();
			child.stderr.destroy();
			settle({ error: new FFmpegError({ command, exitCode, signal, timedOut, stderr }) });
		});
		child.once('close', (exitCode, signal) => {
			if (exitCode === 0 && !timedOut) {
				settle({ stdout: Buffer.concat(stdout).toString('utf8') });
			} else {
				settle({ error: new FFmpegError({ command, exitCode, signal, timedOut, stderr }) });
			}
		});
	});
}

/**
 * 映像ストリームを 1 つ以上含むかどうかを返す。
 * 音声ファイルのカバーアートのような静止画ストリームも映像ストリームとして数える。
 */
export async function hasVideoStream(source: string, opts?: FFmpegRunOptions): Promise<boolean> {
	const out = await run('ffprobe', [
		'-select_streams', 'v',
		'-show_entries', 'stream=codec_type',
		'-of', 'csv=p=0',
		source,
	], opts?.timeout ?? DEFAULT_TIMEOUT.probe);
	return out.trim() !== '';
}

export type VideoStreamInfo = {
	/** 入力ファイル内でのストリーム番号（-map 0:<index> に渡す） */
	index: number;
	/** 長さ（秒）。ストリームにもコンテナにも長さの情報がない場合は null */
	duration: number | null;
};

function parseDuration(value: unknown): number | null {
	const duration = typeof value === 'string' || typeof value === 'number' ? Number(value) : Number.NaN;
	return Number.isFinite(duration) && duration >= 0 ? duration : null;
}

/**
 * 解像度が最も大きい映像ストリームを返す。映像ストリームがなければ null（カバーアートは映像ストリームとして数えない）。
 * 長さは、音声だけが長いファイルでもずれないよう、ストリーム自身の長さを優先する。
 */
export async function probeVideoStream(source: string, opts?: FFmpegRunOptions): Promise<VideoStreamInfo | null> {
	const out = await run('ffprobe', [
		'-select_streams', 'V', // 大文字の V はカバーアートのような添付画像を除いた映像ストリーム
		'-show_entries', 'stream=index,codec_type,width,height,duration:format=duration',
		'-of', 'json',
		source,
	], opts?.timeout ?? DEFAULT_TIMEOUT.probe);
	const probed = JSON.parse(out) as {
		streams?: { index: number; codec_type?: string; width?: number; height?: number; duration?: string }[];
		format?: { duration?: string };
	};

	let best: NonNullable<typeof probed.streams>[number] | null = null;
	for (const stream of probed.streams ?? []) {
		if (stream.codec_type !== 'video') continue;
		const size = (stream.width ?? 0) * (stream.height ?? 0);
		if (best == null || size > (best.width ?? 0) * (best.height ?? 0)) best = stream;
	}
	if (best == null) return null;

	return {
		index: best.index,
		duration: parseDuration(best.duration) ?? parseDuration(probed.format?.duration),
	};
}

export function buildThumbnailArgs(source: string, streamIndex: number, seekSeconds: number, outPath: string): string[] {
	return [
		'-ss', String(seekSeconds), // 入力側でシークする（デコード量が減る）
		'-i', source,
		'-map', `0:${streamIndex}`,
		'-frames:v', '1',
		'-y',
		outPath, // 出力形式は拡張子から決まる
	];
}

/**
 * 映像ストリームの長さの 5% の位置のフレームを 1 枚書き出す。
 * 長さが分からない動画や、その位置でフレームが取れなかった動画では、先頭のフレームを使う。
 */
export async function extractVideoThumbnail(source: string, outPath: string, opts?: FFmpegRunOptions): Promise<void> {
	const stream = await probeVideoStream(source, opts);
	if (stream == null) throw new Error('No video stream in input');

	const seekSeconds = stream.duration != null ? stream.duration * 0.05 : 0;
	await run('ffmpeg', buildThumbnailArgs(source, stream.index, seekSeconds, outPath), opts?.timeout ?? DEFAULT_TIMEOUT.thumbnail);
	if (fs.existsSync(outPath)) return;

	// シーク先にフレームがないと、ffmpeg は何も書き出さずに正常終了する
	if (seekSeconds > 0) {
		await run('ffmpeg', buildThumbnailArgs(source, stream.index, 0, outPath), opts?.timeout ?? DEFAULT_TIMEOUT.thumbnail);
		if (fs.existsSync(outPath)) return;
	}
	throw new Error('ffmpeg did not output any frame');
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
export async function extractDetectionFrames(source: string, outDir: string, opts?: FFmpegRunOptions): Promise<void> {
	await run('ffmpeg', buildDetectionFramesArgs(source, outDir), opts?.timeout ?? DEFAULT_TIMEOUT.detectionFrames);
}

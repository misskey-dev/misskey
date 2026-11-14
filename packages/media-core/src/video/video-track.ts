/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import FFmpeg from 'fluent-ffmpeg';

export type VideoTrackLogger = {
	info(message: string): void;
	warn(message: string, error?: unknown): void;
};

/**
 * 動画ファイルに映像トラックがあるかどうかを判定する (ffprobe が必要)
 * （ない場合：m4a, webmなど）
 *
 * detectType の hasVideoTrack に渡すことを想定している
 *
 * @param path ファイルパス
 * @returns 映像トラックがあるかどうか（エラー発生時は常に`true`を返す）
 */
export function hasVideoTrack(path: string, logger?: VideoTrackLogger): Promise<boolean> {
	logger?.info(`Checking the video file. File path: ${path}`);
	return new Promise((resolve) => {
		try {
			FFmpeg.ffprobe(path, (err, metadata) => {
				if (err) {
					logger?.warn(`Could not check the video file. Returns true. File path: ${path}`, err);
					resolve(true);
					return;
				}
				resolve(metadata.streams.some((stream) => stream.codec_type === 'video'));
			});
		} catch (err) {
			logger?.warn(`Could not check the video file. Returns true. File path: ${path}`, err);
			resolve(true);
		}
	});
}

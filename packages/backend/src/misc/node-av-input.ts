/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AV_PKT_DATA_DISPLAYMATRIX } from 'node-av/constants';
import type { Stream } from 'node-av/lib';

/**
 * ローカルの一時ファイルを開くときにデマルチプレクサへ渡すオプション。
 * HLS プレイリストなど他の入力を参照する形式でも、ローカルファイル以外 (http 等) を読みに行かせない。
 */
export const localInputOptions = {
	protocol_whitelist: 'file',
};

/** display matrix の 16.16 固定小数点を実数に戻す */
function fromFixed(value: number): number {
	return value / 65536;
}

/** C の round() と同じく、0.5 を 0 から遠い方へ丸める */
function roundHalfAwayFromZero(value: number): number {
	return Math.sign(value) * Math.round(Math.abs(value));
}

/**
 * 映像ストリームの回転メタデータ (display matrix) に従って、正しい向きに直すフィルタを返す。
 * スマートフォンの縦動画は横長の映像に回転情報を付けて保存されていることが多いため、
 * これを適用しないとサムネイルやセンシティブ判定に横倒しの画像が渡ってしまう。
 *
 * @param stream 映像ストリーム
 * @returns FilterAPI に渡すフィルタ記述。向きを直す必要がなければ null
 */
export function getAutorotateFilter(stream: Stream): string | null {
	const data = stream.codecpar.getCodedSideData(AV_PKT_DATA_DISPLAYMATRIX);
	if (data == null || data.length < 9 * 4) return null;

	// 3x3 の int32 行列。Buffer の byteOffset が 4 の倍数とは限らないため Int32Array ではなく 1 要素ずつ読む
	const matrix = Array.from({ length: 9 }, (_, i) => data.readInt32LE(i * 4));

	// av_display_rotation_get() 相当
	const scaleX = Math.hypot(fromFixed(matrix[0]), fromFixed(matrix[3]));
	const scaleY = Math.hypot(fromFixed(matrix[1]), fromFixed(matrix[4]));
	if (scaleX === 0 || scaleY === 0) return null;
	const rotation = Math.atan2(fromFixed(matrix[1]) / scaleY, fromFixed(matrix[0]) / scaleX) * 180 / Math.PI;

	// fftools の get_rotation() 相当 (av_display_rotation_get() の符号を反転し、0〜360 度に正規化する)
	let theta = roundHalfAwayFromZero(rotation);
	theta -= 360 * Math.floor(theta / 360 + 0.9 / 360);

	// 90度回転
	if (Math.abs(theta - 90) < 1) {
		return matrix[3] > 0 ? 'transpose=cclock_flip' : 'transpose=clock';
	}

	// 180度回転
	if (Math.abs(theta - 180) < 1) {
		const filters: string[] = [];
		if (matrix[0] < 0) filters.push('hflip');
		if (matrix[4] < 0) filters.push('vflip');
		return filters.length > 0 ? filters.join(',') : null;
	}

	// 270度回転
	if (Math.abs(theta - 270) < 1) {
		return matrix[3] < 0 ? 'transpose=clock_flip' : 'transpose=cclock';
	}

	// 任意の角度回転
	if (Math.abs(theta) > 1) {
		return `rotate=${theta}*PI/180`;
	}

	// 0度回転 (回転不要)
	return matrix[4] < 0 ? 'vflip' : null;
}

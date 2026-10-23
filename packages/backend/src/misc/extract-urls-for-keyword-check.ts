/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { domainToUnicode } from 'node:url';
import * as mfm from 'mfm-js';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/const.js';

/**
 * パーセントデコードする。不正なエスケープはその部分だけ元の形のまま残し、有効なUTF-8として解釈できる部分はデコードする
 */
function safeDecodeURIComponent(str: string): string {
	return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
		try {
			return decodeURIComponent(run);
		} catch {
			// 不正なバイト列を含む場合は、UTF-8の1文字分(最大4バイト)ずつ復号を試みる
			const escapes = run.match(/%[0-9A-Fa-f]{2}/g)!;
			let result = '';
			let i = 0;
			while (i < escapes.length) {
				let decoded: string | null = null;
				let len = Math.min(4, escapes.length - i);
				for (; len > 0; len--) {
					try {
						decoded = decodeURIComponent(escapes.slice(i, i + len).join(''));
						break;
					} catch {
						// 次に短い長さで再試行
					}
				}
				if (decoded != null) {
					result += decoded;
					i += len;
				} else {
					result += escapes[i];
					i++;
				}
			}
			return result;
		}
	});
}

/**
 * テキスト中のURLを、キーワードチェック用にクライアントでの表示と同じ形へ正規化して返す
 * (ホスト名はWHATWG URLの正規化を経てUnicode化、パス以降はパーセントデコード)
 *
 * パーセントエンコーディングや全角文字などでドメインを表記し、禁止ワード等をすり抜けるのを防ぐため
 */
export function extractUrlsForKeyWordCheck(text: string): string[] {
	if (!text.includes('://')) return [];

	// 保存時に切り詰められる範囲より後ろは表示されない。
	// また、ホスト名の正規化は結合文字の並べ替えで入力長に対し二次的にコストが増えるため、処理する長さを制限しておく
	const nodes = mfm.parse(text.slice(0, DB_MAX_NOTE_TEXT_LENGTH));
	const urlNodes = mfm.extract(nodes, (node) => node.type === 'url' || node.type === 'link') as (mfm.MfmUrl | mfm.MfmLink)[];

	const urls: string[] = [];
	for (const node of urlNodes) {
		let url: URL;
		try {
			url = new URL(node.props.url);
		} catch {
			continue;
		}

		const hostname = domainToUnicode(url.hostname) || url.hostname;
		const port = url.port !== '' ? `:${url.port}` : '';
		urls.push(url.href);
		urls.push(`${url.protocol}//${hostname}${port}${safeDecodeURIComponent(url.pathname)}${safeDecodeURIComponent(url.search)}${safeDecodeURIComponent(url.hash)}`);
	}

	return urls;
}

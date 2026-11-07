/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { domainToUnicode } from 'node:url';
import * as mfm from 'mfm-js';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { safeDecodeURIComponent } from '@/misc/safe-decode-uri-component.js';

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

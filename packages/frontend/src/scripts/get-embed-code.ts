/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineAsyncComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import { url } from '@/config.js';
import { MOBILE_THRESHOLD } from '@/const.js';
import * as os from '@/os.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import type { EmbedParams, EmbeddableEntity } from '@/scripts/embed-page.js';
import { defaultEmbedParams, embedRouteWithScrollbar } from '@/scripts/embed-page.js';

/**
 * パラメータを正規化する（埋め込みコード作成用）
 * @param params パラメータ
 * @returns 正規化されたパラメータ
 */
export function normalizeEmbedParams(params: EmbedParams): Record<string, string> {
	// paramsのvalueをすべてstringに変換。undefinedやnullはプロパティごと消す
	const normalizedParams: Record<string, string> = {};
	for (const key in params) {
		// デフォルトの値と同じならparamsに含めない
		if (params[key] == null || params[key] === defaultEmbedParams[key]) {
			continue;
		}
		switch (typeof params[key]) {
			case 'number':
				normalizedParams[key] = params[key].toString();
				break;
			case 'boolean':
				normalizedParams[key] = params[key] ? 'true' : 'false';
				break;
			default:
				normalizedParams[key] = params[key];
				break;
		}
	}
	return normalizedParams;
}

/**
 * 埋め込みコードを生成（iframe IDの発番もやる）
 */
export function getEmbedCode(path: string, params?: EmbedParams): string {
	const iframeId = 'v1_' + uuid(); // 将来embed.jsのバージョンが上がったとき用にv1_を付けておく

	let paramString = '';
	if (params) {
		const searchParams = new URLSearchParams(normalizeEmbedParams(params));
		paramString = searchParams.toString() === '' ? '' : '?' + searchParams.toString();
	}

	const iframeCode = [
		`<iframe src="${url + path + paramString}" data-misskey-embed-id="${iframeId}" style="border: none; width: 100%; max-width: 500px; height: 300px; color-scheme: light dark;"></iframe>`,
		`<script defer src="${url}/embed.js"></script>`,
	];
	return iframeCode.join('\n');
}

/**
 * 埋め込みコードを生成してコピーする（カスタマイズ機能つき）
 *
 * カスタマイズ機能がいらない場合（事前にパラメータを指定する場合）は getEmbedCode を直接使ってください
 */
export function copyEmbedCode(entity: EmbeddableEntity, idOrUsername: string, params?: EmbedParams) {
	const _params = { ...params };

	if (embedRouteWithScrollbar.includes(entity) && _params.maxHeight == null) {
		_params.maxHeight = 700;
	}

	// PCじゃない場合はコードカスタマイズ画面を出さずにそのままコピー
	if (window.innerWidth < MOBILE_THRESHOLD) {
		const _idOrUsername = entity === 'user-timeline' ? `@${idOrUsername}` : idOrUsername;
		copyToClipboard(getEmbedCode(`/embed/${entity}/${_idOrUsername}`, _params));
		os.success();
	} else {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkEmbedCodeGenDialog.vue')), {
			entity,
			idOrUsername,
			params: _params,
		}, {
			closed: () => dispose(),
		});
	}
}

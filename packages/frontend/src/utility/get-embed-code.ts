/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineAsyncComponent } from 'vue';
import { url } from '@@/js/config.js';
import { defaultEmbedParams, embedRouteWithScrollbar } from '@@/js/embed-page.js';
import type { EmbedParams, EmbeddableEntity } from '@@/js/embed-page.js';
import { genId } from '@/utility/id.js';
import * as os from '@/os.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';

const MOBILE_THRESHOLD = 500;

/**
 * パラメータを正規化する（埋め込みコード作成用）
 * @param params パラメータ
 * @returns 正規化されたパラメータ
 */
export function normalizeEmbedParams(params: EmbedParams): Record<string, string> {
	// paramsのvalueをすべてstringに変換。undefinedやnullはプロパティごと消す
	const normalizedParams: Record<string, string> = {};
	for (const key in params) {
		const k = key as keyof EmbedParams;
		// デフォルトの値と同じならparamsに含めない
		if (params[k] == null || params[k] === defaultEmbedParams[k]) {
			continue;
		}
		switch (typeof params[k]) {
			case 'number':
				normalizedParams[k] = params[k].toString();
				break;
			case 'boolean':
				normalizedParams[k] = params[k] ? 'true' : 'false';
				break;
			default:
				normalizedParams[k] = params[k];
				break;
		}
	}
	return normalizedParams;
}

/**
 * 埋め込みコードを生成（iframe IDの発番もやる）
 */
export function getEmbedCode(path: string, params?: EmbedParams): string {
	const iframeId = 'v1_' + genId(); // 将来embed.jsのバージョンが上がったとき用にv1_を付けておく

	let paramString = '';
	if (params) {
		const searchParams = new URLSearchParams(normalizeEmbedParams(params));
		paramString = searchParams.toString() === '' ? '' : '?' + searchParams.toString();
	}

	const iframeCode = [
		`<iframe src="${url + path + paramString}" data-misskey-embed-id="${iframeId}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="border: none; width: 100%; max-width: 500px; height: 300px; color-scheme: light dark;"></iframe>`,
		`<script defer src="${url}/embed.js"></script>`,
	];
	return iframeCode.join('\n');
}

/**
 * 埋め込みコードを生成してコピーする（カスタマイズ機能つき）
 *
 * カスタマイズ機能がいらない場合（事前にパラメータを指定する場合）は getEmbedCode を直接使ってください
 */
export async function genEmbedCode(entity: EmbeddableEntity, id: string, params?: EmbedParams) {
	const _params = { ...params };

	if (embedRouteWithScrollbar.includes(entity) && _params.maxHeight == null) {
		_params.maxHeight = 700;
	}

	// PCじゃない場合はコードカスタマイズ画面を出さずにそのままコピー
	if (window.innerWidth < MOBILE_THRESHOLD) {
		copyToClipboard(getEmbedCode(`/embed/${entity}/${id}`, _params));
	} else {
		const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkEmbedCodeGenDialog.vue').then(x => x.default), {
			entity,
			id,
			params: _params,
		}, {
			closed: () => dispose(),
		});
	}
}

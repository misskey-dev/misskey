/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

//#region Embed関連の定義

/** 埋め込みページかどうか */
export function isEmbedPage() {
	return location.pathname.startsWith('/embed');
}

/** 埋め込みの対象となるエンティティ（/embed/xxx の xxx の部分と対応させる） */
const embeddableEntities = [
	'notes',
	'user-timeline',
	'clips',
	'tags',
] as const;

/** 埋め込みの対象となるエンティティ */
export type EmbeddableEntity = typeof embeddableEntities[number];

/** 内部でスクロールがあるページ */
export const embedRouteWithScrollbar: EmbeddableEntity[] = [
	'clips',
	'tags',
	'user-timeline'
];

/** 埋め込みコードのパラメータ */
export type EmbedParams = {
	maxHeight?: number;
	colorMode?: 'light' | 'dark';
	rounded?: boolean;
	border?: boolean;
	autoload?: boolean;
	header?: boolean;
};

/** 正規化されたパラメータ */
export type ParsedEmbedParams = Required<Omit<EmbedParams, 'maxHeight' | 'colorMode'>> & Pick<EmbedParams, 'maxHeight' | 'colorMode'>;

/** パラメータのデフォルトの値 */
export const defaultEmbedParams = {
	maxHeight: undefined,
	colorMode: undefined,
	rounded: true,
	border: true,
	autoload: false,
	header: true,
} as const;

//#endregion

/**
 * パラメータを正規化する（埋め込みページ初期化用）
 * @param searchParams URLSearchParamsもしくはクエリ文字列
 * @returns 正規化されたパラメータ
 */
export function parseEmbedParams(searchParams: URLSearchParams | string): ParsedEmbedParams {
	let _searchParams: URLSearchParams;
	if (typeof searchParams === 'string') {
		_searchParams = new URLSearchParams(searchParams);
	} else {
		_searchParams = searchParams;
	}

	const params: EmbedParams = {};
	for (const key in defaultEmbedParams) {
		const value = _searchParams.get(key);
		if (value != null) {
			if (value === 'true') {
				params[key] = true;
			} else if (value === 'false') {
				params[key] = false;
			} else if (!isNaN(Number(value))) {
				params[key] = Number(value);
			} else if (key === 'colorMode' && ['light', 'dark'].includes(value)) {
				params[key] = value as 'light' | 'dark';
			} else {
				params[key] = value;
			}
		}
	}

	return {
		...defaultEmbedParams,
		...params,
	};
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { miLocalStorage } from '@/local-storage.js';
import { isEmbedPage } from '@/scripts/embed-page.js';

const address = new URL(document.querySelector<HTMLMetaElement>('meta[property="instance_url"]')?.content || location.href);
const siteName = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = location.origin + '/api';
export const wsOrigin = location.origin;
export const lang = miLocalStorage.getItem('lang') ?? 'en-US';
export const langs = _LANGS_;
const preParseLocale = miLocalStorage.getItem('locale');
export let locale = preParseLocale ? JSON.parse(preParseLocale) : null;
export const version = _VERSION_;
export const instanceName = siteName === 'Misskey' || siteName == null ? host : siteName;
export const ui = miLocalStorage.getItem('ui');
export const debug = miLocalStorage.getItem('debug') === 'true';
// config.tsでインポートしているファイルと、その内部で使用される関数では使用できない。
// それらでembedPageの判定をしたい場合は関数を直接呼び出すこと
export const embedPage = isEmbedPage();

export function updateLocale(newLocale): void {
	locale = newLocale;
}

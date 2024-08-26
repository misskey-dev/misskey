/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const address = new URL(document.querySelector<HTMLMetaElement>('meta[property="instance_url"]')?.content || location.href);
const siteName = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = location.origin + '/api';
export const lang = localStorage.getItem('lang') ?? 'en-US';
export const langs = _LANGS_;
const preParseLocale = localStorage.getItem('locale');
export const locale = preParseLocale ? JSON.parse(preParseLocale) : null;
export const instanceName = siteName === 'Misskey' || siteName == null ? host : siteName;
export const debug = localStorage.getItem('debug') === 'true';

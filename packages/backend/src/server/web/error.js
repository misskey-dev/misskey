/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

'use strict';

(() => {
	document.addEventListener('DOMContentLoaded', async () => {
		const supportedLangs = LANGS;
		let lang = localStorage.getItem('lang');
		if (!supportedLangs.includes(lang)) {
			if (supportedLangs.includes(navigator.language)) {
				lang = navigator.language;
			} else {
				lang = supportedLangs.find(x => x.split('-')[0] === navigator.language);

				// Fallback
				if (lang == null) lang = 'en-US';
			}
		}
		const locale = ERROR_MESSAGES[lang];
		const messages = locale._bootErrors;
		const reload = locale.reload;

		const reloadEls = document.querySelectorAll('[data-i18n-reload]');
		for (const el of reloadEls) {
			el.textContent = reload;
		}

		const i18nEls = document.querySelectorAll('[data-i18n]');
		for (const el of i18nEls) {
			const key = el.dataset.i18n;
			if (key && messages[key]) {
				el.textContent = messages[key];
			}
		}
	});
})();

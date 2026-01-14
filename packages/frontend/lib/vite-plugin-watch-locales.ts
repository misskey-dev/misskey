/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import path from 'node:path'
import locales from 'i18n';

const localesDir = path.resolve(__dirname, '../../../locales')

/**
 * 外部ファイルを監視し、必要に応じてwebSocketでメッセージを送るViteプラグイン
 * @returns {import('vite').Plugin}
 */
export default function pluginWatchLocales() {
	return {
		name: 'watch-locales',

		configureServer(server) {
			const localeYmlPaths = Object.keys(locales).map(locale => path.join(localesDir, `${locale}.yml`));

			// watcherにパスを追加
			server.watcher.add(localeYmlPaths);

			server.watcher.on('change', (filePath) => {
				if (localeYmlPaths.includes(filePath)) {
					server.ws.send({
						type: 'custom',
						event: 'locale-update',
						data: filePath.match(/([^\/]+)\.yml$/)?.[1] || null,
					})
				}
			});
		},
	};
}

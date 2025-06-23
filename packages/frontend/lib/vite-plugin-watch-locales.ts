import path from 'node:path'
import locales from '../../../locales/index.js';

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
						event: 'language-update',
						data: filePath.match(/([^\/]+)\.yml$/)?.[1] || null,
					})
				}
			});
    },
  };
}

import { build } from '../src/index.js';

/**
 * フロントエンド用の locale JSON を書き出す
 * Service Worker が HTTP 経由で取得するために必要
 * @param destDir 出力先ディレクトリ（例: built/_frontend_dist_/locales）
 * @param version バージョン文字列（ファイル名とJSON内に埋め込まれる）
 */
export async function writeFrontendLocalesJson(destDir: string, version: string): Promise<void> {
	const { mkdir, writeFile } = await import('node:fs/promises');
	const { resolve } = await import('node:path');

	await mkdir(destDir, { recursive: true });

	const builtLocales = build();
	const v = { '_version_': version };

	for (const [lang, locale] of Object.entries(builtLocales)) {
		await writeFile(
			resolve(destDir, `${lang}.${version}.json`),
			JSON.stringify({ ...locale, ...v }),
			'utf-8',
		);
	}
}

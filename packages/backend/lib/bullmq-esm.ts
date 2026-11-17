import type { Plugin } from 'rolldown';

/**
 * bullmqをESMビルドからバンドルし、未使用のPostgreSQLバックエンドを取り除くプラグイン
 *
 * bullmqのpackage.jsonにはexportsが無いため、通常はmain（CJSビルド）が選ばれてtree-shakingが効かない。
 * また、ルートのindexが`export * from './postgres'`しているため、Redisしか使わない場合でも
 * PostgreSQLバックエンド（インライン化されたSQLを含む）がすべてバンドルされてしまう。
 */
export function bullmqEsmPlugin(): Plugin {
	const postgresEntryRegex = /[\\/]node_modules[\\/]bullmq[\\/]dist[\\/]esm[\\/]postgres[\\/]index\.js$/;
	let postgresStubbed = false;

	return {
		name: 'bullmq-esm',
		buildStart() {
			postgresStubbed = false;
		},
		async resolveId(source, importer, options) {
			if (source !== 'bullmq') return null;
			return this.resolve('bullmq/dist/esm/index.js', importer, { ...options, skipSelf: true });
		},
		load(id) {
			if (!postgresEntryRegex.test(id)) return null;
			postgresStubbed = true;
			return 'export {};';
		},
		buildEnd(error) {
			if (error == null && !postgresStubbed) {
				this.warn('bullmq PostgreSQL backend entry was not found; the stub is no longer applied. Check the bullmq dist layout.');
			}
		},
	};
}

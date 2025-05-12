import { createSearchEngine } from '@hanamisskey/browser-search';
import type { SearchEngineInstance, SearchIndex } from '@hanamisskey/browser-search';

let searchEngine: SearchEngineInstance | null = null;

function assertIsEmoji(emoji: unknown): emoji is SearchIndex {
	if (typeof emoji !== 'object' || emoji === null) return false;
	if (!('emojis' in emoji) || !Array.isArray(emoji.emojis)) return false;
	return true;
}

onmessage = async (event: MessageEvent) => {
	if (!('id' in event.data && typeof event.data.id === 'number')) {
		return;
	}
	if (!('type' in event.data && typeof event.data.type === 'string')) {
		return;
	}

	switch (event.data.type) {
		case 'init': {
			if (searchEngine) {
				postMessage({ id: event.data.id, type: 'init', success: false });
				return;
			}

			if ('preCompiledIndex' in event.data && event.data.preCompiledIndex instanceof Uint8Array) {
				searchEngine = await createSearchEngine({
					preCompiledIndex: event.data.preCompiledIndex,
				});
				postMessage({ id: event.data.id, type: 'init', success: true });
				return;
			}

			searchEngine = await createSearchEngine();
			postMessage({ id: event.data.id, type: 'init', success: true });
			break;
		}

		//#region Index
		case 'createIndex': {
			if (!searchEngine) throw new Error('Search engine not initialized');
			if ('emojis' in event.data && assertIsEmoji(event.data.emojis)) {
				searchEngine.addDocuments(event.data.emojis);
				postMessage({ id: event.data.id, type: 'createIndex', success: true });
				return;
			}
			postMessage({ id: event.data.id, type: 'createIndex', success: false });
			break;
		};
		case 'insertIndex': {
			if (!searchEngine) throw new Error('Search engine not initialized');
			if (
				'name' in event.data && typeof event.data.name === 'string' &&
				'aliases' in event.data && Array.isArray(event.data.aliases) &&
				event.data.aliases.every((alias) => typeof alias === 'string')
			) {
				searchEngine.addDocument(event.data.name, event.data.aliases);
				postMessage({ id: event.data.id, type: 'insertIndex', success: true });
				return;
			}
			postMessage({ id: event.data.id, type: 'insertIndex', success: false });
			break;
		};
		case 'updateIndex': {
			if (!searchEngine) throw new Error('Search engine not initialized');
			if ('emojis' in event.data && assertIsEmoji(event.data.emojis)) {
				for (const emoji of event.data.emojis.emojis) {
					searchEngine.updateDocument(emoji.name, emoji.aliases);
				}
				postMessage({ id: event.data.id, type: 'updateIndex', success: true });
				return;
			}
			postMessage({ id: event.data.id, type: 'updateIndex', success: false });
			break;
		};
		case 'deleteIndex': {
			if (!searchEngine) throw new Error('Search engine not initialized');
			if ('emojis' in event.data && assertIsEmoji(event.data.emojis)) {
				for (const emoji of event.data.emojis.emojis) {
					searchEngine.removeDocument(emoji.name);
				}
				postMessage({ id: event.data.id, type: 'deleteIndex', success: true });
				return;
			}
			postMessage({ id: event.data.id, type: 'deleteIndex', success: false });
			break;
		};
		case 'dumpIndex': {
			if (!searchEngine) throw new Error('Search engine not initialized');
			const result = searchEngine.dump();
			postMessage({ id: event.data.id, type: 'dumpIndex', success: true, data: result });
			return;
		};
		case 'clearIndex': {
			if (!searchEngine) throw new Error('Search engine not initialized');
			searchEngine.clearIndex();
			postMessage({ id: event.data.id, type: 'clearIndex', success: true });
			return;
		};
		//#endregion

		case 'search': {
			if (!searchEngine) throw new Error('Search engine not initialized');
			if ('query' in event.data && typeof event.data.query === 'string') {
				let limit: number | undefined = undefined;
				if ('limit' in event.data && typeof event.data.limit === 'number') {
					if (event.data.limit > 0) {
						limit = event.data.limit;
					}
				}
				const result = await searchEngine.search(event.data.query, limit);
				postMessage({ id: event.data.id, type: 'search', success: true, data: result });
				return;
			}
			postMessage({ id: event.data.id, type: 'search', success: false });
			break;
		};

		case 'searchUnlimited': {
			if (!searchEngine) throw new Error('Search engine not initialized');
			if ('query' in event.data && typeof event.data.query === 'string') {
				const result = await searchEngine.searchNoLimit(event.data.query);
				postMessage({ id: event.data.id, type: 'searchUnlimited', success: true, data: result });
				return;
			}
			postMessage({ id: event.data.id, type: 'searchUnlimited', success: false });
			break;
		};
	}
};

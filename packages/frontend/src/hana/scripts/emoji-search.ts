import * as Misskey from 'misskey-js';
import EmojiSearch from '@/workers/emoji-search.js?worker';
import { get, set, del } from '@/utility/idb-proxy.js';
import type { SearchIndex } from '@hanamisskey/browser-search';

const INDEX_NAME = 'emojiSearchIndexV2';

let emojiSearchWorker: Worker | null = null;
let hasInitialized = false;

if (import.meta.env.MODE !== 'test') {
	emojiSearchWorker = new EmojiSearch();
}

function postMessageWithHandler<T>(opts: {
	worker: Worker;
	message: Record<string, any>;
	expectedType: string;
	handler?: (data: any) => T;
}): Promise<T> {
	return new Promise((resolve, reject) => {
		const inqId = Date.now();
		opts.message.id = inqId;

		function messageHandler(event: MessageEvent) {
			if (event.data.id !== inqId) return;
			if (event.data.type !== opts.expectedType) return;

			opts.worker.removeEventListener('message', messageHandler);

			if (event.data.success) {
				resolve(opts.handler ? opts.handler(event.data) : event.data);
			} else {
				reject(new Error(`Failed to process message of type: ${opts.expectedType}`));
			}
		}

		opts.worker.addEventListener('message', messageHandler);
		opts.worker.postMessage(opts.message);
	});
}

export function initEmojiSearch(emojis?: Misskey.entities.EmojiSimple[]) {
	return new Promise<void>(async (resolve) => {
		if (!emojiSearchWorker || import.meta.env.MODE === 'test') {
			resolve();
			return;
		}

		const preCompiledIndexV1 = await get('emojiSearchIndex');

		if (preCompiledIndexV1 != null) {
			await del('emojiSearchIndex');
		}

		const preCompiledIndex = await get(INDEX_NAME);

		if (_DEV_) console.log('[Emoji Search] Initializing Emoji Search', { preCompiledIndex });

		try {
			await postMessageWithHandler({
				worker: emojiSearchWorker,
				message: { type: 'init', preCompiledIndex: preCompiledIndex instanceof Uint8Array ? preCompiledIndex : undefined },
				expectedType: 'init',
			});

			hasInitialized = true;

			if (preCompiledIndex == null) {
				if (_DEV_) console.log('[Emoji Search] No precompiled index found, creating a new one');

				const _emojis: Misskey.entities.EmojiSimple[] = emojis ?? (await get('emojis')) ?? [];

				const emojisToBeIndexed = {
					emojis: _emojis.map((emoji) => ({
						name: emoji.name,
						aliases: emoji.aliases,
					})),
				} satisfies SearchIndex;

				await postMessageWithHandler({
					worker: emojiSearchWorker!,
					message: { type: 'createIndex', emojis: emojisToBeIndexed },
					expectedType: 'createIndex',
				});

				await postMessageWithHandler({
					worker: emojiSearchWorker!,
					message: { type: 'dumpIndex' },
					expectedType: 'dumpIndex',
					handler: (dumpData) => set(INDEX_NAME, dumpData.data),
				});
			}

			resolve();
		} catch (error) {
			console.error('Failed to initialize Emoji Search', error);
			resolve();
		}
	});
}

export async function searchCustomEmojis(query: string, limit = 10) {
	if (!emojiSearchWorker || !hasInitialized) return;

	return await postMessageWithHandler<string[]>({
		worker: emojiSearchWorker,
		message: { type: 'search', query, limit },
		expectedType: 'search',
		handler: (data) => data.data,
	});
}

export async function searchCustomEmojisUnlimited(query: string) {
	if (!emojiSearchWorker || !hasInitialized) return;

	return await postMessageWithHandler<string[]>({
		worker: emojiSearchWorker,
		message: { type: 'searchUnlimited', query },
		expectedType: 'searchUnlimited',
		handler: (data) => data.data,
	});
}

export async function addCustomEmojiToSearchIndex(emoji: Misskey.entities.EmojiSimple) {
	if (!emojiSearchWorker || !hasInitialized) return;

	await postMessageWithHandler({
		worker: emojiSearchWorker,
		message: { type: 'insertIndex', name: emoji.name, aliases: emoji.aliases },
		expectedType: 'insertIndex',
	});

	await saveEmojiSearchIndex();
}

export async function updateCustomEmojiOnSearchIndex(emojis: Misskey.entities.EmojiSimple[]) {
	if (!emojiSearchWorker || !hasInitialized) return;

	const emojisToBeIndexed = {
		emojis: emojis.map((emoji) => ({
			name: emoji.name,
			aliases: emoji.aliases,
		})),
	} satisfies SearchIndex;

	await postMessageWithHandler({
		worker: emojiSearchWorker,
		message: { type: 'updateIndex', emojis: emojisToBeIndexed },
		expectedType: 'updateIndex',
	});

	await saveEmojiSearchIndex();
}

export async function removeCustomEmojiFromSearchIndex(emojis: Misskey.entities.EmojiSimple[]) {
	if (!emojiSearchWorker || !hasInitialized) return;

	const emojisToBeIndexed = {
		emojis: emojis.map((emoji) => ({
			name: emoji.name,
			aliases: emoji.aliases,
		})),
	} satisfies SearchIndex;

	await postMessageWithHandler({
		worker: emojiSearchWorker,
		message: { type: 'removeIndex', emojis: emojisToBeIndexed },
		expectedType: 'removeIndex',
	});

	await saveEmojiSearchIndex();
}

export async function clearEmojiSearchIndex() {
	if (emojiSearchWorker && hasInitialized) {
		await postMessageWithHandler({
			worker: emojiSearchWorker,
			message: { type: 'clearIndex' },
			expectedType: 'clearIndex',
		});
	}

	await del(INDEX_NAME);
	await saveEmojiSearchIndex();
}

export async function regenerateCustomEmojiSearchIndex(emojis: Misskey.entities.EmojiSimple[]) {
	if (!emojiSearchWorker || !hasInitialized) return;

	await postMessageWithHandler({
		worker: emojiSearchWorker,
		message: { type: 'clearIndex' },
		expectedType: 'clearIndex',
	});

	const emojisToBeIndexed = {
		emojis: emojis.map((emoji) => ({
			name: emoji.name,
			aliases: emoji.aliases,
		})),
	} satisfies SearchIndex;

	await postMessageWithHandler({
		worker: emojiSearchWorker,
		message: { type: 'createIndex', emojis: emojisToBeIndexed },
		expectedType: 'createIndex',
	});

	await saveEmojiSearchIndex();
}

export async function saveEmojiSearchIndex() {
	if (!emojiSearchWorker || !hasInitialized) return;

	await postMessageWithHandler({
		worker: emojiSearchWorker,
		message: { type: 'dumpIndex' },
		expectedType: 'dumpIndex',
		handler: (dumpData) => set(INDEX_NAME, dumpData.data),
	});
}

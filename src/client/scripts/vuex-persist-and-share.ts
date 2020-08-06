import { Store, MutationPayload } from 'vuex';
import { BroadcastChannel } from 'broadcast-channel';
import { VuexPersistDB } from './vuex-idb';

// Vuexモジュールかつ永続化ストアの名前を列挙
const modules = ['device', 'deviceUser', 'settings', 'instance'] as const;

export function VuexPersistAndShare<State>() {
	const persistDB = new VuexPersistDB();
	const ch = new BroadcastChannel<MutationPayload>('vuexShare', {
		webWorkerSupport: false
	});

	return async (store: Store<State>) => {
		// 互換性のためlocalStorageを検索
		const old = localStorage.getItem('vuex');

		if (old) {
			store.replaceState({
				...store.state,
				...JSON.parse(old)
			});
			localStorage.removeItem('vuex');
		} else {
			await Promise.all(persistDB.stores.map(n => persistDB.entries(n)))
			.then(vals => vals.map(entries => Object.fromEntries(entries)))
			.then(vals => {
				let savedState = {};

				persistDB.stores.map((n, i) => {
					if (n === 'store') savedState = { ...savedState, ...vals[i] };
					else savedState[n] = vals[i];
				});

				store.replaceState({
					...store.state,
					...savedState
				});
			});
		}

		const passedPayloads: any[] = [];

		store.subscribe((mutation, state) => {
			if (passedPayloads.includes(mutation.payload)) {
				passedPayloads.splice(passedPayloads.indexOf(mutation.payload), 1);
				return;
			}

			const splited = mutation.type.split('/');
			const module = splited[0] as typeof modules[number]; // 型定義と実際の値は違う

			if (splited.length === 1) {
				// mutationがルートの場合
				persistDB.set('i', state.i, 'store');

				modules.map(m => {
					persistDB.bulkSet(Object.entries(state[m]), m);
				});
			} else if (modules.includes(module)) {
				// mutationがモジュールの場合
				persistDB.bulkSet(Object.entries(state[module]), module);
			}

			ch.postMessage(mutation);
		});

		ch.addEventListener('message', mutation => {
			passedPayloads.push(mutation.payload);
			store.commit(mutation.type, mutation.payload);
		});
	};
}

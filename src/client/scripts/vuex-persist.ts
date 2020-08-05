import { Store } from 'vuex';
import { VuexPersistDB } from './vuex-idb';

// Vuexモジュールかつ永続化ストアの名前を列挙
const modules = ['device', 'deviceUser', 'settings', 'instance'] as const;

export function VuexPersist<State>() {
	const persistDB = new VuexPersistDB();

	return (store: Store<State>) => {
		// 互換性のためlocalStorageを検索
		const old = localStorage.getItem('vuex');

		if (old) {
			store.replaceState({
				...store.state,
				...JSON.parse(old)
			});
			localStorage.removeItem('vuex');
		} else {
			Promise.all(persistDB.stores.map(n => persistDB.entries(n)))
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

		store.subscribe((mutation, state) => {
			const splited = mutation.type.split('/');
			const module = splited[0] as typeof modules[number]; // 型定義と実際の値は違う

			if (splited.length === 1) {
				persistDB.set('i', state.i, 'store');
				modules.map(module => persistDB.bulkSet(Object.entries(state[module]), module));
			} else if (modules.includes(module)) {
				persistDB.bulkSet(Object.entries(state[module]), module);
			}
		});
	};
}

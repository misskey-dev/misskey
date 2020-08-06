import { Store, MutationPayload, ActionPayload } from 'vuex';
// SafariがBroadcastChannel未実装なのでライブラリを使う
import { BroadcastChannel } from 'broadcast-channel';
import { VuexPersistDB } from './vuex-idb';

/**
 * Vuexのstate永続化及びcommit・dispatchをタブ間で共有するvuexプラグインです
 * @param states 永続化するルートのstate
 * @param modules 永続化するmodule
 */
export function VuexPersistAndShare<State>(states: string[], modules: string[]) {
	const persistDB = new VuexPersistDB();
	const mutationCh = new BroadcastChannel<MutationPayload>('vuexMutationShare', {
		webWorkerSupport: false
	});
	const actionCh = new BroadcastChannel<ActionPayload>('vuexActionShare', {
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
					else savedState[n] = { ...store.state[n], ...vals[i] };
				});

				store.replaceState({
					...store.state,
					...savedState
				});
			});
		}

		// 別タブから来たmutation/actionのpayloadのオブジェクトを覚えておく
		const passedPayloads: any[] = [];

		// 別タブからのmutationを実行
		mutationCh.addEventListener('message', mutation => {
			passedPayloads.push(mutation.payload);
			store.commit(mutation.type, mutation.payload);
		});

		store.subscribe((mutation, state) => {
			if (passedPayloads.includes(mutation.payload)) {
				// 別タブから来たmutationの場合は処理をしない
				passedPayloads.splice(passedPayloads.indexOf(mutation.payload), 1);
				return;
			}

			const splited = mutation.type.split('/');
			const module = splited[0]; // ここの型定義と実際の値は違います

			// 永続化
			if (splited.length === 1) {
				// mutationがルートの場合
				persistDB.bulkSet(states.map(s => [s, state[s]]), 'store');

				modules.map(m => {
					persistDB.bulkSet(Object.entries(state[m]), m);
				});
			} else if (modules.includes(module)) {
				// mutationがモジュールの場合
				persistDB.bulkSet(Object.entries(state[module]), module);
			}

			// ほかのタブにmutationを伝達
			mutationCh.postMessage(mutation);
		});

		// 別タブからのactionを実行
		actionCh.addEventListener('message', action => {
			passedPayloads.push(action.payload);
			store.dispatch(action.type, action.payload);
		});

		store.subscribeAction((action) => {
			if (passedPayloads.includes(action.payload)) {
				// 別タブから来たactionの場合は処理をしない
				passedPayloads.splice(passedPayloads.indexOf(action.payload), 1);
				return;
			}

			actionCh.postMessage(action);
		});
	};
}

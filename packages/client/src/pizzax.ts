import { onUnmounted, Ref, ref, watch } from 'vue';
import { $i } from './account';
import { api } from './os';
import { get, set } from './scripts/idb-proxy';
import { defaultStore } from './store';
import { stream } from './stream';

type StateDef = Record<string, {
	where: 'account' | 'device' | 'deviceAccount';
	default: any;
}>;

type State<T extends StateDef> = { [K in keyof T]: T[K]['default']; };
type ReactiveState<T extends StateDef> = { [K in keyof T]: Ref<T[K]['default']>; };

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

const connection = $i && stream.useChannel('main');

export class Storage<T extends StateDef> {
	public readonly ready: Promise<void>;
	public readonly loaded: Promise<void>;

	public readonly key: string;
	public readonly deviceStateKeyName: string;
	public readonly deviceAccountStateKeyName: string;
	public readonly registryCacheKeyName: string;

	public readonly def: T;

	// TODO: これが実装されたらreadonlyにしたい: https://github.com/microsoft/TypeScript/issues/37487
	public readonly state = {} as State<T>;
	public readonly reactiveState = {} as ReactiveState<T>;

	// 簡易的にキューイングして占有ロックとする
	private currentIdbJob: Promise<any> = Promise.resolve();
	private addIdbSetJob<T>(job: () => Promise<T>) {
		const promise = this.currentIdbJob.then(job, e => {
			console.error('Pizzax failed to save data to idb!', e);
			return job();
		});
		this.currentIdbJob = promise;
		return promise;
	}

	constructor(key: string, def: T) {
		this.key = key;
		this.deviceStateKeyName = `pizzax::${key}`;
		this.deviceAccountStateKeyName = $i ? `pizzax::${key}::${$i.id}` : '';
		this.registryCacheKeyName = $i ? `pizzax::${key}::cache::${$i.id}` : '';
		this.def = def;

		this.ready = this.init();
		this.loaded = this.ready.then(() => this.load());
	}

	private async init(): Promise<void> {
		await this.migrate();

		const deviceState: State<T> = await get(this.deviceStateKeyName) || {};
		const deviceAccountState = $i ? await get(this.deviceAccountStateKeyName) || {} : {};
		const registryCache = $i ? await get(this.registryCacheKeyName) || {} : {};
	
		for (const [k, v] of Object.entries(this.def) as [keyof T, T[keyof T]][]) {
			if (v.where === 'device' && Object.prototype.hasOwnProperty.call(deviceState, k)) {
				this.state[k] = deviceState[k];
			} else if (v.where === 'account' && $i && Object.prototype.hasOwnProperty.call(registryCache, k)) {
				this.state[k] = registryCache[k];
			} else if (v.where === 'deviceAccount' && Object.prototype.hasOwnProperty.call(deviceAccountState, k)) {
				this.state[k] = deviceAccountState[k];
			} else {
				this.state[k] = v.default;
				if (_DEV_) console.log('Use default value', k, v.default);
			}
		}
		for (const [k, v] of Object.entries(this.state) as [keyof T, T[keyof T]][]) {
			this.reactiveState[k] = ref(v);
		}

		if ($i) {
			// streamingのuser storage updateイベントを監視して更新
			connection?.on('registryUpdated', ({ scope, key, value }: { scope?: string[], key: keyof T, value: T[typeof key]['default'] }) => {
				if (!scope || scope.length !== 2 || scope[0] !== 'client' || scope[1] !== this.key || this.state[key] === value) return;
	
				this.state[key] = value;
				this.reactiveState[key].value = value;
	
				this.addIdbSetJob(async () => {
					const cache = await get(this.registryCacheKeyName);
					if (cache[key] !== value) {
						cache[key] = value;
						await set(this.registryCacheKeyName, cache);
					}
				});
			});
		}
	}

	private load(): Promise<void> {
		return new Promise((resolve, reject) => {
			if ($i) {
				// api関数と循環参照なので一応setTimeoutしておく
				setTimeout(async () => {
					await defaultStore.ready;

					api('i/registry/get-all', { scope: ['client', this.key] })
					.then(kvs => {
						const cache = {};
						for (const [k, v] of Object.entries(this.def)) {
							if (v.where === 'account') {
								if (Object.prototype.hasOwnProperty.call(kvs, k)) {
									this.state[k as keyof T] = kvs[k];
									this.reactiveState[k as keyof T].value = kvs[k as string];
									cache[k] = kvs[k];
								} else {
									this.state[k as keyof T] = v.default;
									this.reactiveState[k].value = v.default;
								}
							}
						}
	
						return set(this.registryCacheKeyName, cache);
					})
					.then(() => resolve());
				}, 1);
			}

			resolve();
		});
	}

	public set<K extends keyof T>(key: K, value: T[K]['default']): Promise<void> {
		const rawValue = JSON.parse(JSON.stringify(value));

		if (_DEV_) console.log('set', key, rawValue, value);

		this.state[key] = rawValue;
		this.reactiveState[key].value = rawValue;

		return this.addIdbSetJob(async () => {
			if (_DEV_) console.log(`set ${key} start`);
			switch (this.def[key].where) {
				case 'device': {
					const deviceState = await get(this.deviceStateKeyName) || {};
					deviceState[key] = rawValue;
					await set(this.deviceStateKeyName, deviceState);
					break;
				}
				case 'deviceAccount': {
					if ($i == null) break;
					const deviceAccountState = await get(this.deviceAccountStateKeyName) || {};
					deviceAccountState[key] = rawValue;
					await set(this.deviceAccountStateKeyName, deviceAccountState);
					break;
				}
				case 'account': {
					if ($i == null) break;
					const cache = await get(this.registryCacheKeyName) || {};
					cache[key] = rawValue;
					await set(this.registryCacheKeyName, cache);
					await api('i/registry/set', {
						scope: ['client', this.key],
						key: key,
						value: rawValue
					});
					break;
				}
			}
			if (_DEV_) console.log(`set ${key} complete`);
		});
	}

	public push<K extends keyof T>(key: K, value: ArrayElement<T[K]['default']>): void {
		const currentState = this.state[key];
		this.set(key, [...currentState, value]);
	}

	public reset(key: keyof T) {
		this.set(key, this.def[key].default);
	}

	/**
	 * 特定のキーの、簡易的なgetter/setterを作ります
	 * 主にvue場で設定コントロールのmodelとして使う用
	 */
	public makeGetterSetter<K extends keyof T>(key: K, getter?: (v: T[K]) => unknown, setter?: (v: unknown) => T[K]) {
		const valueRef = ref(this.state[key]);

		const stop = watch(this.reactiveState[key], val => {
			valueRef.value = val;
		});

		// NOTE: vueコンポーネント内で呼ばれない限りは、onUnmounted は無意味なのでメモリリークする
		onUnmounted(() => {
			stop();
		});

		// TODO: VueのcustomRef使うと良い感じになるかも
		return {
			get: () => {
				if (getter) {
					return getter(valueRef.value);
				} else {
					return valueRef.value;
				}
			},
			set: (value: unknown) => {
				const val = setter ? setter(value) : value;
				this.set(key, val);
				valueRef.value = val;
			}
		};
	}

	// localStorage => indexedDBのマイグレーション
	private async migrate() {
		const deviceState = localStorage.getItem(this.deviceStateKeyName);
		if (deviceState) { 
			await set(this.deviceStateKeyName, JSON.parse(deviceState));
			localStorage.removeItem(this.deviceStateKeyName);
		}

		const deviceAccountState = $i && localStorage.getItem(this.deviceAccountStateKeyName);
		if ($i && deviceAccountState) {
			await set(this.deviceAccountStateKeyName, JSON.parse(deviceAccountState));
			localStorage.removeItem(this.deviceAccountStateKeyName);
		}

		const registryCache = $i && localStorage.getItem(this.registryCacheKeyName);
		if ($i && registryCache) {
			await set(this.registryCacheKeyName, JSON.parse(registryCache));
			localStorage.removeItem(this.registryCacheKeyName);
		}
	}
}

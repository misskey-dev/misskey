import { customRef, onUnmounted, Ref, ref, watch } from 'vue';
import { $i } from './account';
import { api } from './os';

type StateDef = Record<string, {
	where: 'account' | 'device' | 'deviceAccount';
	default: any;
}>;

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

/**
 * 非リアクティブなストレージ。リアクティブに扱いたいときはrefメソッドを使用する（暫定）
 */
export class Storage<T extends StateDef> {
	public readonly key: string;

	public readonly def: T;

	public readonly state: { [U in keyof T]: T[U]['default'] };

	public readonly reactiveState: { [U in keyof T]: Ref<T[U]['default']> };

	private watchers: { key: keyof T, callback: Function }[] = [];

	constructor(key: string, def: T) {
		this.key = 'pizzax::' + key;
		this.def = def;

		// TODO: indexedDBにする
		const deviceState = JSON.parse(localStorage.getItem(this.key) || '{}');
		const deviceAccountState = $i ? JSON.parse(localStorage.getItem(this.key + '::' + $i.id) || '{}') : {};

		const state = {};
		const reactiveState = {};
		for (const [k, v] of Object.entries(def)) {
			if (v.where === 'device' && Object.prototype.hasOwnProperty.call(deviceState, k)) {
				state[k] = deviceState[k];
			} else if (v.where === 'account' && $i && Object.prototype.hasOwnProperty.call($i.clientData, k)) {
				state[k] = $i.clientData[k];
			} else if (v.where === 'deviceAccount' && Object.prototype.hasOwnProperty.call(deviceAccountState, k)) {
				state[k] = deviceAccountState[k];
			} else {
				state[k] = v.default;
			}
		}
		for (const [k, v] of Object.entries(state)) {
			reactiveState[k] = ref(v);
		}
		this.state = state as any;
		this.reactiveState = reactiveState as any;

		watch(() => $i, () => {
			if (_DEV_) console.log('$i updated');

			for (const [k, v] of Object.entries(def)) {
				if (v.where === 'account') {
					state[k] = $i.clientData[k];
					reactiveState[k].value = $i.clientData[k];
				}
			}
		});
	}

	public set<K extends keyof T>(key: K, value: T[K]['default']): void {
		this.state[key] = value;
		this.reactiveState[key].value = value;
		for (const watcher of this.watchers) {
			if (watcher.key === key) watcher.callback(value);
		}

		switch (this.def[key].where) {
			case 'device': {
				const deviceState = JSON.parse(localStorage.getItem(this.key) || '{}');
				deviceState[key] = value;
				localStorage.setItem(this.key, JSON.stringify(deviceState));
				break;
			}
			case 'deviceAccount': {
				if ($i == null) break;
				const deviceAccountState = JSON.parse(localStorage.getItem(this.key + '::' + $i.id) || '{}');
				deviceAccountState[key] = value;
				localStorage.setItem(this.key + '::' + $i.id, JSON.stringify(deviceAccountState));
				break;
			}
			case 'account': {
				api('i/update-client-setting', {
					name: key,
					value: value
				});
				break;
			}
		}
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
		// TODO: VueのcustomRef使うと良い感じになるかも
		const valueRef = ref(this.state[key]);
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

	public ref<K extends keyof T>(key: K) {
		return customRef((track, trigger) => {
			// TODO: pushしたままだとメモリリークするので何らかの方法で参照が無くなったことを検知し削除する
			this.watchers.push({
				key,
				callback: () => {
					trigger();
				}
			});

			onUnmounted(() => {
				// TODO
			});

			return {
				get: () => {
					track();
					return this.state[key];
				},
				set: (newValue) => {
					if (_DEV_) {
						console.error(`DO NOT MUTATE ${key} DIRECTLY. USE set METHOD.`);
					}
				}
			};
		});
	}
}

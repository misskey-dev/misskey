import { onUnmounted, Ref, ref, watch } from 'vue';
import { $i } from './account';
import { api } from './os';

type StateDef = Record<string, {
	where: 'account' | 'device' | 'deviceAccount';
	default: any;
}>;

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

export class Storage<T extends StateDef> {
	public readonly key: string;

	public readonly def: T;

	// TODO: これが実装されたらreadonlyにしたい: https://github.com/microsoft/TypeScript/issues/37487
	public readonly state: { [K in keyof T]: T[K]['default'] };
	public readonly reactiveState: { [K in keyof T]: Ref<T[K]['default']> };

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
				if (_DEV_) console.log('Use default value', k, v.default);
			}
		}
		for (const [k, v] of Object.entries(state)) {
			reactiveState[k] = ref(v);
		}
		this.state = state as any;
		this.reactiveState = reactiveState as any;

		if ($i) {
			watch($i, () => {
				if (_DEV_) console.log('$i updated');

				for (const [k, v] of Object.entries(def)) {
					if (v.where === 'account' && Object.prototype.hasOwnProperty.call($i!.clientData, k)) {
						state[k] = $i!.clientData[k];
						reactiveState[k].value = $i!.clientData[k];
					}
				}
			});
		}
	}

	public set<K extends keyof T>(key: K, value: T[K]['default']): void {
		if (_DEV_) console.log('set', key, value);

		this.state[key] = value;
		this.reactiveState[key].value = value;

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
}

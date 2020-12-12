import { ref } from 'vue';

const PREFIX = 'miux:';

/**
 * 常にメモリにロードしておく必要がないような設定情報を保管するストレージ
 */
export class ColdDeviceStorage {
	public static default = {
		sound_masterVolume: 0.3,
		sound_note: { type: 'syuilo/down', volume: 1 },
		sound_noteMy: { type: 'syuilo/up', volume: 1 },
		sound_notification: { type: 'syuilo/pope2', volume: 1 },
		sound_chat: { type: 'syuilo/pope1', volume: 1 },
		sound_chatBg: { type: 'syuilo/waon', volume: 1 },
		sound_antenna: { type: 'syuilo/triple', volume: 1 },
		sound_channel: { type: 'syuilo/square-pico', volume: 1 },
		sound_reversiPutBlack: { type: 'syuilo/kick', volume: 0.3 },
		sound_reversiPutWhite: { type: 'syuilo/snare', volume: 0.3 },
	};

	public static get<T extends keyof typeof ColdDeviceStorage.default>(key: T): typeof ColdDeviceStorage.default[T] {
		// TODO: indexedDBにする
		//       ただしその際はnullチェックではなくキー存在チェックにしないとダメ
		//       (indexedDBはnullを保存できるため、ユーザーが意図してnullを格納した可能性がある)
		const value = localStorage.getItem(PREFIX + key);
		if (value == null) {
			return ColdDeviceStorage.default[key];
		} else {
			return JSON.parse(value);
		}
	}

	public static set(key: keyof typeof ColdDeviceStorage.default, value: any): any {
		localStorage.setItem(PREFIX + key, JSON.stringify(value));
	}
}

const KEY = 'miux_hot';

/**
 * 頻繁にアクセスされる設定情報を保管するストレージ
 */
export class HotDeviceStorage<T> {
	public readonly default: T;

	public readonly state: T;

	constructor(defaultState: T) {
		this.default = defaultState;
		this.state = { ...defaultState };

		// TODO: indexedDBにする
		const data = localStorage.getItem(KEY);
		if (data != null) {
			const x = JSON.parse(data);
			for (const [key, value] of Object.entries(this.default)) {
				if (Object.prototype.hasOwnProperty.call(x, key)) {
					this.state[key] = x[key];
				} else {
					this.state[key] = value;
				}
			}
		}
	}

	set(key: keyof T, value: any): any {
		this.state[key] = value;
		localStorage.setItem(KEY, JSON.stringify(this.state));
	}

	/**
	 * 特定のキーの、簡易的なgetter/setterを作ります
	 * 主にvue場で設定コントロールのmodelとして使う用
	 */
	makeGetterSetter(key: keyof T, getter?, setter?) {
		const valueRef = ref(this.state[key]);
		return {
			get: () => {
				if (getter) {
					return getter(valueRef.value);
				} else {
					return valueRef.value;
				}
			},
			set: (value) => {
				const val = setter ? setter(value) : value;
				this.set(key, val);
				valueRef.value = val;
			}
		};
	}
}

export const hotDeviceStorage = new HotDeviceStorage({
	animation: true,
	animatedMfm: true,
	showGapBetweenNotesInTimeline: true,
});

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		hotDeviceStorage: typeof hotDeviceStorage;
	}
}

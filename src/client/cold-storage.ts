// 常にメモリにロードしておく必要がないような設定情報を保管するストレージ

const PREFIX = 'miux:';

export const defaultDeviceSettings = {
	sound_masterVolume: 0.3,
	sound_note: { type: 'syuilo/down', volume: 1 },
	sound_noteMy: { type: 'syuilo/up', volume: 1 },
	sound_notification: { type: 'syuilo/pope2', volume: 1 },
	sound_chat: { type: 'syuilo/pope1', volume: 1 },
	sound_chatBg: { type: 'syuilo/waon', volume: 1 },
	sound_antenna: { type: 'syuilo/triple', volume: 1 },
	sound_channel: { type: 'syuilo/square-pico', volume: 1 },
	sound_reversiPutBlack: { type: null, volume: 1 },
	sound_reversiPutWhite: { type: null, volume: 1 },
};

export const device = {
	get<T extends keyof typeof defaultDeviceSettings>(key: T): typeof defaultDeviceSettings[T] {
		// TODO: indexedDBにする
		//       ただしその際はnullチェックではなくキー存在チェックにしないとダメ
		//       (indexedDBはnullを保存できるため、ユーザーが意図してnullを格納した可能性がある)
		const value = localStorage.getItem(PREFIX + key);
		if (value == null) {
			return defaultDeviceSettings[key];
		} else {
			return JSON.parse(value);
		}
	},

	set(key: keyof typeof defaultDeviceSettings, value: any): any {
		localStorage.setItem(PREFIX + key, JSON.stringify(value));
	},
};

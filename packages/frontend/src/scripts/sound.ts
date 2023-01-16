import { markRaw } from 'vue';
import { Storage } from '@/pizzax';

export const soundConfigStore = markRaw(new Storage('sound', {
	mediaVolume: {
		where: 'device',
		default: 0.5
	},
	sound_masterVolume: {
		where: 'device',
		default: 0.3
	},
	sound_note: {
		where: 'account',
		default: { type: 'syuilo/down', volume: 1 }
	},
	sound_noteMy: {
		where: 'account',
		default: { type: 'syuilo/up', volume: 1 }
	},
	sound_notification: {
		where: 'account',
		default: { type: 'syuilo/pope2', volume: 1 }
	},
	sound_chat: {
		where: 'account',
		default: { type: 'syuilo/pope1', volume: 1 }
	},
	sound_chatBg: {
		where: 'account',
		default: { type: 'syuilo/waon', volume: 1 }
	},
	sound_antenna: {
		where: 'account',
		default: { type: 'syuilo/triple', volume: 1 }
	},
	sound_channel: {
		where: 'account',
		default: { type: 'syuilo/square-pico', volume: 1 }
	},
}));

await soundConfigStore.ready;

//#region サウンドのColdDeviceStorage => indexedDBのマイグレーション
for (const target of Object.keys(soundConfigStore.state) as Array<keyof typeof soundConfigStore.state>) {
	const value = localStorage.getItem(`miux:${target}`);
	if (value) {
		soundConfigStore.set(target, JSON.parse(value) as typeof soundConfigStore.def[typeof target]['default']);
		localStorage.removeItem(`miux:${target}`);
	}
}
//#endregion

const cache = new Map<string, HTMLAudioElement>();

export const soundsTypes = [
	null,
	'syuilo/up',
	'syuilo/down',
	'syuilo/pope1',
	'syuilo/pope2',
	'syuilo/waon',
	'syuilo/popo',
	'syuilo/triple',
	'syuilo/poi1',
	'syuilo/poi2',
	'syuilo/pirori',
	'syuilo/pirori-wet',
	'syuilo/pirori-square-wet',
	'syuilo/square-pico',
	'syuilo/reverved',
	'syuilo/ryukyu',
	'syuilo/kick',
	'syuilo/snare',
	'syuilo/queue-jammed',
	'aisha/1',
	'aisha/2',
	'aisha/3',
	'noizenecio/kick_gaba1',
	'noizenecio/kick_gaba2',
	'noizenecio/kick_gaba3',
	'noizenecio/kick_gaba4',
	'noizenecio/kick_gaba5',
	'noizenecio/kick_gaba6',
	'noizenecio/kick_gaba7',
] as const;

export function getAudio(file: string, useCache = true): HTMLAudioElement {
	let audio: HTMLAudioElement;
	if (useCache && cache.has(file)) {
		audio = cache.get(file);
	} else {
		audio = new Audio(`/client-assets/sounds/${file}.mp3`);
		if (useCache) cache.set(file, audio);
	}
	return audio;
}

export function setVolume(audio: HTMLAudioElement, volume: number): HTMLAudioElement {
	const masterVolume = soundConfigStore.state.sound_masterVolume;
	audio.volume = masterVolume - ((1 - volume) * masterVolume);
	return audio;
}

export function play(type: string) {
	const sound = soundConfigStore.state[`sound_${type}`];
	if (_DEV_) console.log('play', type, sound);
	if (sound.type == null) return;
	playFile(sound.type, sound.volume);
}

export function playFile(file: string, volume: number) {
	const masterVolume = soundConfigStore.state.sound_masterVolume;
	if (masterVolume === 0) return;

	const audio = setVolume(getAudio(file), volume);
	audio.play();
}

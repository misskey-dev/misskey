import { ColdDeviceStorage } from '@/store';

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
	const masterVolume = ColdDeviceStorage.get('sound_masterVolume');
	audio.volume = masterVolume - ((1 - volume) * masterVolume);
	return audio;
}

export function play(type: string) {
	const sound = ColdDeviceStorage.get('sound_' + type as any);
	if (sound.type == null) return;
	playFile(sound.type, sound.volume);
}

export function playFile(file: string, volume: number) {
	const masterVolume = ColdDeviceStorage.get('sound_masterVolume');
	if (masterVolume === 0) return;

	const audio = setVolume(getAudio(file), volume);
	audio.play();
}

import { ColdDeviceStorage } from '@/store';

const cache = new Map<string, HTMLAudioElement>();

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

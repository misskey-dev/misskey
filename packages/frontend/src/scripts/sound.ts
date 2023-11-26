/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defaultStore } from '@/store.js';

let ctx: AudioContext;
const cache = new Map<string, AudioBuffer>();
let canPlay = true;

export const soundsTypes = [
	null,
	'syuilo/n-aec',
	'syuilo/n-aec-4va',
	'syuilo/n-aec-4vb',
	'syuilo/n-aec-8va',
	'syuilo/n-aec-8vb',
	'syuilo/n-cea',
	'syuilo/n-cea-4va',
	'syuilo/n-cea-4vb',
	'syuilo/n-cea-8va',
	'syuilo/n-cea-8vb',
	'syuilo/n-eca',
	'syuilo/n-eca-4va',
	'syuilo/n-eca-4vb',
	'syuilo/n-eca-8va',
	'syuilo/n-eca-8vb',
	'syuilo/n-ea',
	'syuilo/n-ea-4va',
	'syuilo/n-ea-4vb',
	'syuilo/n-ea-8va',
	'syuilo/n-ea-8vb',
	'syuilo/n-ea-harmony',
	'syuilo/up',
	'syuilo/down',
	'syuilo/pope1',
	'syuilo/pope2',
	'syuilo/waon',
	'syuilo/popo',
	'syuilo/triple',
	'syuilo/bubble1',
	'syuilo/bubble2',
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

export async function loadAudio(file: string, useCache = true) {
	if (ctx == null) {
		ctx = new AudioContext();
	}
	if (useCache && cache.has(file)) {
		return cache.get(file)!;
	}

	const response = await fetch(`/client-assets/sounds/${file}.mp3`);
	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

	if (useCache) {
		cache.set(file, audioBuffer);
	}

	return audioBuffer;
}

export function play(type: 'noteMy' | 'note' | 'antenna' | 'channel' | 'notification' | 'reaction') {
	const sound = defaultStore.state[`sound_${type}`];
	if (_DEV_) console.log('play', type, sound);
	if (sound.type == null || !canPlay) return;

	canPlay = false;
	playFile(sound.type, sound.volume).then(() => {
		// ごく短時間に音が重複しないように
		setTimeout(() => {
			canPlay = true;
		}, 25);
	});
}

export async function playFile(file: string, volume: number) {
	const buffer = await loadAudio(file);
	createSourceNode(buffer, volume)?.start();
}

export function createSourceNode(buffer: AudioBuffer, volume: number) : AudioBufferSourceNode | null {
	const masterVolume = defaultStore.state.sound_masterVolume;
	if (isMute() || masterVolume === 0 || volume === 0) {
		return null;
	}

	const gainNode = ctx.createGain();
	gainNode.gain.value = masterVolume * volume;

	const soundSource = ctx.createBufferSource();
	soundSource.buffer = buffer;
	soundSource.connect(gainNode).connect(ctx.destination);

	return soundSource;
}

export function isMute(): boolean {
	if (defaultStore.state.sound_notUseSound) {
		// サウンドを出力しない
		return true;
	}

	// noinspection RedundantIfStatementJS
	if (defaultStore.state.sound_useSoundOnlyWhenActive && document.visibilityState === 'hidden') {
		// ブラウザがアクティブな時のみサウンドを出力する
		return true;
	}

	return false;
}

/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defaultStore } from '@/store.js';
import * as os from '@/os.js';

const ctx = new AudioContext();
const cache = new Map<string, AudioBuffer>();

export const soundsTypes = [
	null,
	'driveFile',
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

export const operationTypes = [
	'noteMy',
	'note',
	'antenna',
	'channel',
	'notification',
  'reaction',
] as const;

export type SoundType = typeof soundsTypes[number];

export type OperationType = typeof operationTypes[number];

export async function loadAudio(options: { soundType: SoundType, fileId?: string, fileUrl?: string, useCache?: boolean; }) {
	if (_DEV_) console.log('loading audio. opts:', options);
	if (options.soundType === null || (options.soundType === 'driveFile' && !options.fileUrl)) {
		return;
	}
	if (options.useCache ?? true) {
		if (options.soundType === 'driveFile' && options.fileId && cache.has(options.fileId)) {
			if (_DEV_) console.log('use cache');
			return cache.get(options.fileId)!;
		} else if (cache.has(options.soundType)) {
			if (_DEV_) console.log('use cache');
			return cache.get(options.soundType)!;
		}
	}

	let response;

	if (options.soundType === 'driveFile') {
		if (!options.fileUrl) return;
		try {
			response = await fetch(options.fileUrl);
		} catch (err) {
			try {
				// URLが変わっている可能性があるのでドライブ側からURLを取得するフォールバック
				if (!options.fileId) return;
				const apiRes = await os.api('drive/files/show', {
					fileId: options.fileId,
				});
				response = await fetch(apiRes.url);
			} catch (fbErr) {
				// それでも無理なら諦める
				return;
			}
		}
	} else {
		try {
			response = await fetch(`/client-assets/sounds/${options.soundType}.mp3`);
		} catch (err) {
			return;
		}
	}

	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

	if (options.useCache ?? true) {
		if (options.soundType === 'driveFile' && options.fileId) {
			cache.set(options.fileId, audioBuffer);
		} else {
			cache.set(options.soundType, audioBuffer);
		}
	}

	return audioBuffer;
}


export function play(type: OperationType) {
	const sound = defaultStore.state[`sound_${type}`];
	if (_DEV_) console.log('play', type, sound);
	if (sound.type == null) return;
	playFile({
		soundType: sound.type,
		fileId: sound.fileId,
		fileUrl: sound.fileUrl,
		volume: sound.volume,
	});
}

export async function playFile(options: { soundType: SoundType, fileId?: string, fileUrl?: string, volume: number }) {
	const buffer = await loadAudio(options);
	if (!buffer) return;
	createSourceNode(buffer, options.volume)?.start();
}

export function createSourceNode(buffer: AudioBuffer, volume: number) : AudioBufferSourceNode | null {
	const masterVolume = defaultStore.state.sound_masterVolume;
	if (masterVolume === 0 || volume === 0) {
		return null;
	}

	const gainNode = ctx.createGain();
	gainNode.gain.value = masterVolume * volume;

	const soundSource = ctx.createBufferSource();
	soundSource.buffer = buffer;
	soundSource.connect(gainNode).connect(ctx.destination);

	return soundSource;
}

export async function getSoundDuration(file: string): Promise<number> {
	const audioEl = document.createElement('audio');
	audioEl.src = file;
	return new Promise((resolve) => {
		const si = setInterval(() => {
			if (audioEl.readyState > 0) {
				resolve(audioEl.duration * 1000);
				clearInterval(si);
				audioEl.remove();
			}
		}, 100);
	});
}

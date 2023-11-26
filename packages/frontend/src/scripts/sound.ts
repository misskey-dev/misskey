/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { SoundStore } from '@/store.js';
import { defaultStore } from '@/store.js';
import * as os from '@/os.js';

const ctx = new AudioContext();
const cache = new Map<string, AudioBuffer>();
let canPlay = true;

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

/** サウンドの種類 */
export type SoundType = typeof soundsTypes[number];

/** スプライトの種類 */
export type OperationType = typeof operationTypes[number];

/**
 * 音声を読み込む
 * @param soundStore サウンド設定
 * @param options `useCache`: デフォルトは`true` 一度再生した音声はキャッシュする
 */
export async function loadAudio(soundStore: SoundStore, options?: { useCache?: boolean; }) {
	if (_DEV_) console.log('loading audio. opts:', options);
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (soundStore.type === null || (soundStore.type === 'driveFile' && !soundStore.fileUrl)) {
		return;
	}
	if (options?.useCache ?? true) {
		if (soundStore.type === 'driveFile' && cache.has(soundStore.fileId)) {
			if (_DEV_) console.log('use cache');
			return cache.get(soundStore.fileId) as AudioBuffer;
		} else if (cache.has(soundStore.type)) {
			if (_DEV_) console.log('use cache');
			return cache.get(soundStore.type) as AudioBuffer;
		}
	}

	let response;

	if (soundStore.type === 'driveFile') {
		try {
			response = await fetch(soundStore.fileUrl);
		} catch (err) {
			try {
				// URLが変わっている可能性があるのでドライブ側からURLを取得するフォールバック
				const apiRes = await os.api('drive/files/show', {
					fileId: soundStore.fileId,
				});
				response = await fetch(apiRes.url);
			} catch (fbErr) {
				// それでも無理なら諦める
				return;
			}
		}
	} else {
		try {
			response = await fetch(`/client-assets/sounds/${soundStore.type}.mp3`);
		} catch (err) {
			return;
		}
	}

	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

	if (options?.useCache ?? true) {
		if (soundStore.type === 'driveFile') {
			cache.set(soundStore.fileId, audioBuffer);
		} else {
			cache.set(soundStore.type, audioBuffer);
		}
	}

	return audioBuffer;
}

/**
 * 既定のスプライトを再生する
 * @param type スプライトの種類を指定
 */
export function play(operationType: OperationType) {
	const sound = defaultStore.state[`sound_${operationType}`];
	if (_DEV_) console.log('play', operationType, sound);
	if (sound.type == null || !canPlay) return;

	canPlay = false;
	playFile(sound).then(() => {
		// ごく短時間に音が重複しないように
		setTimeout(() => {
			canPlay = true;
		}, 25);
	});
}

/**
 * サウンド設定形式で指定された音声を再生する
 * @param soundStore サウンド設定
 */
export async function playFile(soundStore: SoundStore) {
	const buffer = await loadAudio(soundStore);
	if (!buffer) return;
	createSourceNode(buffer, soundStore.volume)?.start();
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

/**
 * 音声の長さをミリ秒で取得する
 * @param file ファイルのURL（ドライブIDではない）
 */
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

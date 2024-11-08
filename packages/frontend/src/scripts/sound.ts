/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { SoundStore } from '@/store.js';
import { defaultStore } from '@/store.js';
import { $i } from '@/account.js';
import { RateLimiter } from '@/scripts/rate-limiter.js';

let ctx: AudioContext;
const cache = new Map<string, AudioBuffer>();

function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch (_) {
		return false;
	}
}

export const soundsTypes = [
	// 音声なし
	null,

	// ドライブの音声
	...($i?.policies.canUseDriveFileInSoundSettings ? ['_driveFile_'] : []),

	// プリインストール
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
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Note1',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Note2',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Send1',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeA_Send2',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Note1',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Note2',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeB_Send',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Note',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeC_Send',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Note',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeD_Send',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Note',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeE_Send',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Antenna',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Channel',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Chat',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Note',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Notification',
	'Copyright_Misskey.io/HazumiAi/VoiceTypeF_Send',
	'Copyright_Misskey.io/ThinaticSystem/mata_hazukashiikoto_itteru',
	'Copyright_Misskey.io/ThinaticSystem/akemashite_omedetou_gozaimasu',
	'Copyright_Misskey.io/ThinaticSystem/bibi',
	'Copyright_Misskey.io/ThinaticSystem/doya1',
	'Copyright_Misskey.io/ThinaticSystem/doya2',
	'Copyright_Misskey.io/ThinaticSystem/doya3',
	'Copyright_Misskey.io/ThinaticSystem/gege_ltu_win3.1',
	'Copyright_Misskey.io/ThinaticSystem/hekuchi',
	'Copyright_Misskey.io/ThinaticSystem/moresou',
	'Copyright_Misskey.io/ThinaticSystem/muzumuzu_suru',
	'Copyright_Misskey.io/ThinaticSystem/nsho',
	'Copyright_Misskey.io/ThinaticSystem/pepo',
	'Copyright_Misskey.io/ThinaticSystem/picco_n',
	'Copyright_Misskey.io/ThinaticSystem/tenor_sax',
	'Copyright_Misskey.io/ThinaticSystem/topo',
	'Copyright_Misskey.io/ThinaticSystem/tsukapekepinpa',
	'Copyright_Misskey.io/ThinaticSystem/vun_clean',
	'Copyright_Misskey.io/ThinaticSystem/vun_dirty',
	'Copyright_Misskey.io/ThinaticSystem/wa',
	'Copyright_Misskey.io/ThinaticSystem/yonderuzo1',
	'Copyright_Misskey.io/ThinaticSystem/yonderuzo2',
	'Copyright_Misskey.io/ThinaticSystem/yonderuzo3',
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
 * @param url url
 * @param options `useCache`: デフォルトは`true` 一度再生した音声はキャッシュする
 */
export async function loadAudio(url: string, options?: { useCache?: boolean; }) {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (ctx == null) {
		ctx = new AudioContext();
	}
	if (options?.useCache ?? true) {
		if (cache.has(url)) {
			return cache.get(url) as AudioBuffer;
		}
	}

	let response: Response;

	try {
		response = await fetch(url);
	} catch (err) {
		return;
	}

	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

	if (options?.useCache ?? true) {
		cache.set(url, audioBuffer);
	}

	return audioBuffer;
}

/**
 * 既定のスプライトを再生する
 * @param type スプライトの種類を指定
 */
export function playMisskeySfx(operationType: OperationType) {
	const sound = defaultStore.state[`sound_${operationType}`];
	if (sound.type == null || ('userActivation' in navigator && !navigator.userActivation.hasBeenActive)) return;

	playMisskeySfxFile(sound);
}

const rateLimiter = new RateLimiter<string>({ duration: 50, max: 1 });

/**
 * サウンド設定形式で指定された音声を再生する
 * @param soundStore サウンド設定
 */
export async function playMisskeySfxFile(soundStore: SoundStore) {
	if (soundStore.type === null || (soundStore.type === '_driveFile_' && (!$i?.policies.canUseDriveFileInSoundSettings || !soundStore.fileUrl))) {
		return;
	}
	const masterVolume = defaultStore.state.sound_masterVolume;
	if (isMute() || masterVolume === 0 || soundStore.volume === 0) {
		return;
	}
	const url = soundStore.type === '_driveFile_' ? soundStore.fileUrl : `/client-assets/sounds/${soundStore.type}.mp3`;
	const buffer = await loadAudio(url);
	if (!buffer || !rateLimiter.hit(url)) return;
	const volume = soundStore.volume * masterVolume;
	createSourceNode(buffer, { volume }).soundSource.start();
}

export async function playUrl(url: string, opts: {
	volume?: number;
	pan?: number;
	playbackRate?: number;
}) {
	if (opts.volume === 0) {
		return;
	}
	const buffer = await loadAudio(url);
	if (!buffer) return;
	createSourceNode(buffer, opts).soundSource.start();
}

export function createSourceNode(buffer: AudioBuffer, opts: {
	volume?: number;
	pan?: number;
	playbackRate?: number;
}): {
	soundSource: AudioBufferSourceNode;
	panNode: StereoPannerNode;
	gainNode: GainNode;
} {
	const panNode = ctx.createStereoPanner();
	panNode.pan.value = opts.pan ?? 0;

	const gainNode = ctx.createGain();

	gainNode.gain.value = opts.volume ?? 1;

	const soundSource = ctx.createBufferSource();
	soundSource.buffer = buffer;
	soundSource.playbackRate.value = opts.playbackRate ?? 1;
	soundSource
		.connect(panNode)
		.connect(gainNode)
		.connect(ctx.destination);

	return { soundSource, panNode, gainNode };
}

/**
 * 音声の長さをミリ秒で取得する
 * @param file ファイルのURL（ドライブIDではない）
 */
export async function getSoundDuration(file: string): Promise<number> {
	const audioEl = document.createElement('audio');
	audioEl.src = isValidUrl(file) ? file : '';
	return new Promise((resolve, reject) => {
		if (!audioEl.src) {
			reject(new Error('Invalid URL'));
			return;
		}
		const si = setInterval(() => {
			if (audioEl.readyState > 0) {
				resolve(audioEl.duration * 1000);
				clearInterval(si);
				audioEl.remove();
			}
		}, 100);
	});
}

/**
 * ミュートすべきかどうかを判断する
 */
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

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { SoundStore } from '@/preferences/def.js';
import { prefer } from '@/preferences.js';
import { getInitialPrefValue } from '@/preferences/manager.js';

// 型定義
interface AudioOptions {
	volume?: number;
	pan?: number;
	playbackRate?: number;
}

export type OperationType = typeof operationTypes[number];
export type SoundType = typeof soundsTypes[number];

// 定数定義
const THROTTLE_TIME_MS = 25;
const ASSETS_PATH = '/client-assets/sounds';

export class SoundManager {
	private ctx: AudioContext | null = null;
	private bufferCache = new Map<string, AudioBuffer>();
	private isThrottled = false;

	constructor() {
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', () => this.dispose());
		}
	}

	/**
	 * AudioContextの取得
	 */
	private getContext(): AudioContext {
		if (!this.ctx) {
			this.ctx = new AudioContext();
		}
		return this.ctx;
	}

	/**
	 * リソースの解放
	 */
	public dispose() {
		void this.ctx?.close();
		this.ctx = null;
		this.bufferCache.clear();
	}

	/**
	 * sourceNodeを作成
	 */
	public createSourceNode(buffer: AudioBuffer, opts: AudioOptions): {
		sourceNode: AudioBufferSourceNode;
		panNode: StereoPannerNode;
		gainNode: GainNode;
	} {
		const ctx = this.getContext();

		if (ctx.state === 'suspended') {
			void ctx.resume();
		}

		const sourceNode = ctx.createBufferSource();
		sourceNode.buffer = buffer;
		sourceNode.playbackRate.value = opts.playbackRate ?? 1;

		const panNode = ctx.createStereoPanner();
		panNode.pan.value = opts.pan ?? 0;

		const gainNode = ctx.createGain();
		gainNode.gain.value = opts.volume ?? 1;

		sourceNode
			.connect(panNode)
			.connect(gainNode)
			.connect(ctx.destination);

		return { sourceNode, panNode, gainNode };
	}

	/**
	 * 音声の読み込み
	 */
	public async loadAudio(url: string, useCache = true): Promise<AudioBuffer | undefined> {
		if (useCache && this.bufferCache.has(url)) {
			return this.bufferCache.get(url);
		}

		try {
			const ctx = this.getContext();
			const response = await window.fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

			if (useCache) {
				this.bufferCache.set(url, audioBuffer);
			}

			return audioBuffer;
		} catch (err) {
			console.error(`Failed to load audio: ${url}`, err);
			return undefined;
		}
	}

	/**
	 * オペレーションに応じて音声を再生する
	 */
	public async playSfx(operationType: OperationType): Promise<void> {
		const soundPref = prefer.s[`sound.on.${operationType}`];
		const success = await this.playSfxFile(soundPref);

		// ドライブファイル失敗時のフォールバック
		if (!success && soundPref.type === '_driveFile_') {
			const defaultSound = getInitialPrefValue(`sound.on.${operationType}`);
			const soundName = defaultSound.type as Exclude<SoundType, '_driveFile_'>;

			if (typeof _DEV_ !== 'undefined' && _DEV_) {
				console.warn(`Fallback to default sound: ${soundName}`);
			}

			await this.playSfxFileInternal({
				type: soundName,
				volume: soundPref.volume,
			});
		}
	}

	/**
	 * SoundStore設定に基づく再生
	 */
	public async playSfxFile(soundStore: SoundStore): Promise<boolean> {
		if (this.isThrottled) return false;

		// ユーザーインタラクション判定
		if ('userActivation' in navigator && !navigator.userActivation.hasBeenActive) {
			return false;
		}

		if (soundStore.type === null || (soundStore.type === '_driveFile_' && !soundStore.fileUrl)) {
			return false;
		}

		this.isThrottled = true;
		try {
			return await this.playSfxFileInternal(soundStore);
		} finally {
			window.setTimeout(() => {
				this.isThrottled = false;
			}, THROTTLE_TIME_MS);
		}
	}

	/**
	 * 内部再生ロジック
	 */
	private async playSfxFileInternal(soundStore: SoundStore): Promise<boolean> {
		const masterVolume = prefer.s['sound.masterVolume'];

		if (this.shouldMute() || masterVolume === 0 || soundStore.volume === 0) {
			return true;
		}

		const url = soundStore.type === '_driveFile_'
			? soundStore.fileUrl
			: `${ASSETS_PATH}/${soundStore.type}.mp3`;

		if (!url) return false;

		const buffer = await this.loadAudio(url);
		if (!buffer) return false;

		this.playBuffer(buffer, { volume: soundStore.volume * masterVolume });
		return true;
	}

	/**
	 * 直接URLを指定して再生
	 */
	public async playUrl(url: string, opts: AudioOptions) {
		if (opts.volume === 0) return;
		const buffer = await this.loadAudio(url);
		if (buffer) {
			this.playBuffer(buffer, opts);
		}
	}

	/**
	 * AudioBufferの再生実行
	 */
	private playBuffer(buffer: AudioBuffer, opts: AudioOptions) {
		const { sourceNode } = this.createSourceNode(buffer, opts);
		sourceNode.start();
	}

	/**
	 * 音声の長さを取得
	 */
	public async getDuration(fileUrl: string): Promise<number> {
		const buffer = await this.loadAudio(fileUrl);
		return buffer ? buffer.duration * 1000 : 0;
	}

	private shouldMute(): boolean {
		if (prefer.s['sound.notUseSound']) return true;
		if (prefer.s['sound.useSoundOnlyWhenActive'] && document.visibilityState === 'hidden') return true;
		return false;
	}
}

export const soundsTypes = [
	// 音声なし
	null,

	// ドライブの音声
	'_driveFile_',

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
] as const;

export const operationTypes = [
	'noteMy',
	'note',
	'notification',
	'reaction',
	'chatMessage',
] as const;

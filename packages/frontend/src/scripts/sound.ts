/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import { Storage } from '@/pizzax';

export const soundConfigStore = markRaw(new Storage('sound', {
	mediaVolume: {
		where: 'device',
		default: 0.5,
	},
	sound_masterVolume: {
		where: 'device',
		default: 0.3,
	},
	sound_note: {
		where: 'account',
		default: { type: 'syuilo/n-aec', volume: 1 },
	},
	sound_noteMy: {
		where: 'account',
		default: { type: 'syuilo/n-cea-4va', volume: 1 },
	},
	sound_notification: {
		where: 'account',
		default: { type: 'syuilo/n-ea', volume: 1 },
	},
	sound_chat: {
		where: 'account',
		default: { type: 'syuilo/pope1', volume: 1 },
	},
	sound_chatBg: {
		where: 'account',
		default: { type: 'syuilo/waon', volume: 1 },
	},
	sound_antenna: {
		where: 'account',
		default: { type: 'syuilo/triple', volume: 1 },
	},
	sound_channel: {
		where: 'account',
		default: { type: 'syuilo/square-pico', volume: 1 },
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

export function play(type: 'noteMy' | 'note' | 'antenna' | 'channel' | 'notification') {
	const sound = soundConfigStore.state[`sound_${type}`];
	if (_DEV_) console.log('play', type, sound);
	if (sound.type == null) return;
	playFile(sound.type, sound.volume);
}

export function playFile(file: string, volume: number) {
	const audio = setVolume(getAudio(file), volume);
	if (audio.volume === 0) return;
	audio.play();
}

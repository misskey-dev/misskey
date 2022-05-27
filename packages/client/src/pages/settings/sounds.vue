<template>
<div class="_formRoot">
	<FormRange v-model="masterVolume" :min="0" :max="1" :step="0.05" :text-converter="(v) => `${Math.floor(v * 100)}%`" class="_formBlock">
		<template #label>{{ i18n.ts.masterVolume }}</template>
	</FormRange>

	<FormSection>
		<template #label>{{ i18n.ts.sounds }}</template>
		<FormLink v-for="type in Object.keys(sounds)" :key="type" style="margin-bottom: 8px;" @click="edit(type)">
			{{ $t('_sfx.' + type) }}
			<template #suffix>{{ sounds[type].type || i18n.ts.none }}</template>
			<template #suffixIcon><i class="fas fa-chevron-down"></i></template>
		</FormLink>
	</FormSection>

	<FormButton danger class="_formBlock" @click="reset()"><i class="fas fa-redo"></i> {{ i18n.ts.default }}</FormButton>
</div>
</template>

<script lang="ts" setup>
import { computed, defineExpose, ref } from 'vue';
import FormRange from '@/components/form/range.vue';
import FormButton from '@/components/ui/button.vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import { soundConfigStore, playFile } from '@/scripts/sound';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const masterVolume = computed(soundConfigStore.makeGetterSetter('sound_masterVolume'));

const volumeIcon = computed(() => masterVolume.value === 0 ? 'fas fa-volume-mute' : 'fas fa-volume-up');

const sounds = ref({
	note: soundConfigStore.reactiveState.sound_note,
	noteMy: soundConfigStore.reactiveState.sound_noteMy,
	notification: soundConfigStore.reactiveState.sound_notification,
	chat: soundConfigStore.reactiveState.sound_chat,
	chatBg: soundConfigStore.reactiveState.sound_chatBg,
	antenna: soundConfigStore.reactiveState.sound_antenna,
	channel: soundConfigStore.reactiveState.sound_channel,
});

const soundsTypes = [
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
	'noizenecio/kick_gaba',
	'noizenecio/kick_gaba2',
];

async function edit(type) {
	const { canceled, result } = await os.form(i18n.t('_sfx.' + type), {
		type: {
			type: 'enum',
			enum: soundsTypes.map(x => ({
				value: x,
				label: x == null ? i18n.ts.none : x,
			})),
			label: i18n.ts.sound,
			default: sounds.value[type].type,
		},
		volume: {
			type: 'range',
			mim: 0,
			max: 1,
			step: 0.05,
			textConverter: (v) => `${Math.floor(v * 100)}%`,
			label: i18n.ts.volume,
			default: sounds.value[type].volume
		},
		listen: {
			type: 'button',
			content: i18n.ts.listen,
			action: (_, values) => {
				playFile(values.type, values.volume);
			}
		}
	});
	if (canceled) return;

	const v = {
		type: result.type,
		volume: result.volume,
	};

	soundConfigStore.set(`sound_${type}` as keyof typeof soundConfigStore.def, v);
}

function reset() {
	for (const sound of Object.keys(sounds.value)) {
		const v = soundConfigStore.def['sound_' + sound].default;
		soundConfigStore.reset(`sound_${sound}` as keyof typeof soundConfigStore.def);
	}
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.sounds,
		icon: 'fas fa-music',
		bg: 'var(--bg)',
	}
});
</script>

<template>
<div class="_formRoot">
	<FormRange v-model="masterVolume" :min="0" :max="1" :step="0.05" :text-converter="(v) => `${Math.floor(v * 100)}%`" class="_formBlock">
		<template #label>{{ $ts.masterVolume }}</template>
	</FormRange>

	<FormSection>
		<template #label>{{ $ts.sounds }}</template>
		<FormLink v-for="type in Object.keys(sounds)" :key="type" style="margin-bottom: 8px;" @click="edit(type)">
			{{ $t('_sfx.' + type) }}
			<template #suffix>{{ sounds[type].type || $ts.none }}</template>
			<template #suffixIcon><i class="fas fa-chevron-down"></i></template>
		</FormLink>
	</FormSection>

	<FormButton danger class="_formBlock" @click="reset()"><i class="fas fa-redo"></i> {{ $ts.default }}</FormButton>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormRange from '@/components/form/range.vue';
import FormButton from '@/components/ui/button.vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import { soundConfigStore, playFile } from '@/scripts/sound';
import * as symbols from '@/symbols';

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

export default defineComponent({
	components: {
		FormLink,
		FormButton,
		FormRange,
		FormSection,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.sounds,
				icon: 'fas fa-music',
				bg: 'var(--bg)',
			},
			sounds: {} as any,
		}
	},

	computed: {
		masterVolume: soundConfigStore.makeGetterSetter('sound_masterVolume'), // TODO: (外部)関数にcomputedを使うのはアレなので直す
		volumeIcon() {
			return this.masterVolume === 0 ? 'fas fa-volume-mute' : 'fas fa-volume-up';
		}
	},

	created() {
		this.sounds.note = soundConfigStore.reactiveState.sound_note;
		this.sounds.noteMy = soundConfigStore.reactiveState.sound_noteMy;
		this.sounds.notification = soundConfigStore.reactiveState.sound_notification;
		this.sounds.chat = soundConfigStore.reactiveState.sound_chat;
		this.sounds.chatBg = soundConfigStore.reactiveState.sound_chatBg;
		this.sounds.antenna = soundConfigStore.reactiveState.sound_antenna;
		this.sounds.channel = soundConfigStore.reactiveState.sound_channel;
	},

	methods: {
		async edit(type) {
			const { canceled, result } = await os.form(this.$t('_sfx.' + type), {
				type: {
					type: 'enum',
					enum: soundsTypes.map(x => ({
						value: x,
						label: x == null ? this.$ts.none : x,
					})),
					label: this.$ts.sound,
					default: this.sounds[type].type,
				},
				volume: {
					type: 'range',
					mim: 0,
					max: 1,
					step: 0.05,
					textConverter: (v) => `${Math.floor(v * 100)}%`,
					label: this.$ts.volume,
					default: this.sounds[type].volume
				},
				listen: {
					type: 'button',
					content: this.$ts.listen,
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
		},

		reset() {
			for (const sound of Object.keys(this.sounds)) {
				soundConfigStore.reset(`sound_${sound}` as keyof typeof soundConfigStore.def);
			}
		}
	}
});
</script>

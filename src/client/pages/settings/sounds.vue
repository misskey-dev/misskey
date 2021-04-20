<template>
<FormBase>
	<FormRange v-model:value="masterVolume" :min="0" :max="1" :step="0.05">
		<template #label><i class="fas fa-volume-icon"></i> {{ $ts.masterVolume }}</template>
	</FormRange>

	<FormGroup>
		<template #label>{{ $ts.sounds }}</template>
		<FormButton v-for="type in Object.keys(sounds)" :key="type" :center="false" @click="edit(type)">
			{{ $t('_sfx.' + type) }}
			<template #suffix>{{ sounds[type].type || $ts.none }}</template>
			<template #suffixIcon><i class="fas fa-chevron-down"></i></template>
		</FormButton>
	</FormGroup>

	<FormButton @click="reset()" danger><i class="fas fa-redo"></i> {{ $ts.default }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormRange from '@client/components/form/range.vue';
import FormSelect from '@client/components/form/select.vue';
import FormBase from '@client/components/form/base.vue';
import FormButton from '@client/components/form/button.vue';
import FormGroup from '@client/components/form/group.vue';
import * as os from '@client/os';
import { ColdDeviceStorage } from '@client/store';
import { playFile } from '@client/scripts/sound';
import * as symbols from '@client/symbols';

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
	'aisha/1',
	'aisha/2',
	'aisha/3',
	'noizenecio/kick_gaba',
	'noizenecio/kick_gaba2',
];

export default defineComponent({
	components: {
		FormSelect,
		FormButton,
		FormBase,
		FormRange,
		FormGroup,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.sounds,
				icon: 'fas fa-music'
			},
			sounds: {},
		}
	},

	computed: {
		masterVolume: { // TODO: (外部)関数にcomputedを使うのはアレなので直す
			get() { return ColdDeviceStorage.get('sound_masterVolume'); },
			set(value) { ColdDeviceStorage.set('sound_masterVolume', value); }
		},
		volumeIcon() {
			return this.masterVolume === 0 ? faVolumeMute : 'fas fa-volume-up';
		}
	},

	created() {
		this.sounds.note = ColdDeviceStorage.get('sound_note');
		this.sounds.noteMy = ColdDeviceStorage.get('sound_noteMy');
		this.sounds.notification = ColdDeviceStorage.get('sound_notification');
		this.sounds.chat = ColdDeviceStorage.get('sound_chat');
		this.sounds.chatBg = ColdDeviceStorage.get('sound_chatBg');
		this.sounds.antenna = ColdDeviceStorage.get('sound_antenna');
		this.sounds.channel = ColdDeviceStorage.get('sound_channel');
		this.sounds.reversiPutBlack = ColdDeviceStorage.get('sound_reversiPutBlack');
		this.sounds.reversiPutWhite = ColdDeviceStorage.get('sound_reversiPutWhite');
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
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

			ColdDeviceStorage.set('sound_' + type, v);
			this.sounds[type] = v;
		},

		reset() {
			for (const sound of Object.keys(this.sounds)) {
				const v = ColdDeviceStorage.default['sound_' + sound];
				ColdDeviceStorage.set('sound_' + sound, v);
				this.sounds[sound] = v;
			}
		}
	}
});
</script>

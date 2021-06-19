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
	'app/1',
	'wechat/0',
	'wechat/1',
	'wechat/2',
	'wechat/3',
	'wechat/4',
	'qq/0',
	'qq/1',
	'qq/2',
	'qq/3',
	'whatapp/0',
	'whatapp/1',
	'whatapp/2',
	'whatapp/3',
	'whatapp/4',
	'whatapp/5',
	'whatapp/6',
	'whatapp/7',
	'meizu_16x/1/00',
	'meizu_16x/1/01',
	'meizu_16x/1/02',
	'meizu_16x/1/03',
	'meizu_16x/1/04',
	'meizu_16x/1/05',
	'meizu_16x/1/06',
	'meizu_16x/1/07',
	'meizu_16x/1/08',
	'meizu_16x/1/09',
	'meizu_16x/1/10',
	'meizu_16x/1/11',
	'meizu_16x/1/12',
	'meizu_16x/1/13',
	'meizu_16x/1/14',
	'meizu_16x/1/15',
	'meizu_16x/1/16',
	'meizu_16x/1/17',
	'meizu_16x/1/18',
	'meizu_16x/1/19',
	'meizu_16x/1/20',
	'meizu_16x/1/21',
	'meizu_16x/1/22',
	'meizu_16x/1/23',
	'meizu_16x/1/24',
	'meizu_16x/1/25',
	'meizu_16x/1/26',
	'meizu_16x/1/27',
	'meizu_16x/1/28',
	'meizu_16x/1/29',
	'meizu_16x/1/30',
	'meizu_16x/1/31',
	'meizu_16x/2/00',
	'meizu_16x/2/01',
	'meizu_16x/2/02',
	'meizu_16x/2/03',
	'meizu_16x/2/04',
	'meizu_16x/2/05',
	'meizu_16x/2/06',
	'meizu_16x/2/07',
	'meizu_16x/2/08',
	'meizu_16x/2/09',
	'meizu_16x/2/10',
	'meizu_16x/2/11',
	'meizu_16x/2/12',
	'meizu_16x/2/13',
	'meizu_16x/2/14',
	'meizu_16x/2/15',
	'meizu_16x/2/16',
	'meizu_16x/2/17',
	'meizu_16x/2/18',
	'meizu_16x/2/19',
	'meizu_16x/2/20',
	'meizu_16x/2/21',
	'meizu_16x/2/22',
	'meizu_16x/2/23',
	'meizu_16x/2/24',
	'meizu_16x/2/25',
	'meizu_16x/2/26',
	'meizu_16x/2/27',
	'meizu_16x/2/28',
	'meizu_16x/2/29',
	'meizu_16x/2/30',
	'meizu_16x/2/31',
	'meizu_16x/2/32',
	'meizu_16x/2/33',
	'meizu_16x/2/34',
	'meizu_16x/2/35',
	'meizu_16x/2/36',
	'meizu_16x/2/37',
	'meizu_16x/2/38',
	'meizu_16x/2/39',
	'meizu_16x/2/40',
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
			return this.masterVolume === 0 ? 'fas fa-volume-mute' : 'fas fa-volume-up';
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

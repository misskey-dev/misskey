<template>
<div class="_section">
	<div class="_card">
		<div class="_title"><Fa :icon="faMusic"/> {{ $t('sounds') }}</div>
		<div class="_content">
			<MkRange v-model:value="sfxVolume" :min="0" :max="1" :step="0.1">
				<Fa slot="icon" :icon="volumeIcon"/>
				<span slot="title">{{ $t('volume') }}</span>
			</MkRange>
		</div>
		<div class="_content">
			<MkSelect v-model:value="sfxNote">
				<template #label>{{ $t('_sfx.note') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxNote)" v-if="sfxNote"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxNoteMy">
				<template #label>{{ $t('_sfx.noteMy') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxNoteMy)" v-if="sfxNoteMy"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxNotification">
				<template #label>{{ $t('_sfx.notification') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxNotification)" v-if="sfxNotification"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxChat">
				<template #label>{{ $t('_sfx.chat') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxChat)" v-if="sfxChat"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxChatBg">
				<template #label>{{ $t('_sfx.chatBg') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxChatBg)" v-if="sfxChatBg"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxAntenna">
				<template #label>{{ $t('_sfx.antenna') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxAntenna)" v-if="sfxAntenna"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxChannel">
				<template #label>{{ $t('_sfx.channel') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxChannel)" v-if="sfxChannel"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faMusic, faPlay, faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons';
import MkSelect from '@/components/ui/select.vue';
import MkRange from '@/components/ui/range.vue';
import * as os from '@/os';

const sounds = [
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
	'aisha/1',
	'aisha/2',
	'aisha/3',
	'noizenecio/kick_gaba',
	'noizenecio/kick_gaba2',
];

export default defineComponent({
	components: {
		MkSelect,
		MkRange,
	},

	data() {
		return {
			sounds,
			faMusic, faPlay, faVolumeUp, faVolumeMute,
		}
	},

	computed: {
		sfxVolume: {
			get() { return this.$store.state.device.sfxVolume; },
			set(value) { this.$store.commit('device/set', { key: 'sfxVolume', value: parseFloat(value, 10) }); }
		},

		sfxNote: {
			get() { return this.$store.state.device.sfxNote; },
			set(value) { this.$store.commit('device/set', { key: 'sfxNote', value }); }
		},

		sfxNoteMy: {
			get() { return this.$store.state.device.sfxNoteMy; },
			set(value) { this.$store.commit('device/set', { key: 'sfxNoteMy', value }); }
		},

		sfxNotification: {
			get() { return this.$store.state.device.sfxNotification; },
			set(value) { this.$store.commit('device/set', { key: 'sfxNotification', value }); }
		},

		sfxChat: {
			get() { return this.$store.state.device.sfxChat; },
			set(value) { this.$store.commit('device/set', { key: 'sfxChat', value }); }
		},

		sfxChatBg: {
			get() { return this.$store.state.device.sfxChatBg; },
			set(value) { this.$store.commit('device/set', { key: 'sfxChatBg', value }); }
		},

		sfxAntenna: {
			get() { return this.$store.state.device.sfxAntenna; },
			set(value) { this.$store.commit('device/set', { key: 'sfxAntenna', value }); }
		},

		sfxChannel: {
			get() { return this.$store.state.device.sfxChannel; },
			set(value) { this.$store.commit('device/set', { key: 'sfxChannel', value }); }
		},

		volumeIcon: {
			get() {
				return this.sfxVolume === 0 ? faVolumeMute : faVolumeUp;
			}
		}
	},

	methods: {
		listen(sound) {
			const audio = new Audio(`/assets/sounds/${sound}.mp3`);
			audio.volume = this.$store.state.device.sfxVolume;
			audio.play();
		},
	}
});
</script>

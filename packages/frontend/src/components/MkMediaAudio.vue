<template>
<div v-if="hide" class="mk-media-audio-cw" @click="hide = false">
	<div>
		<b><i class="ti ti-alert-triangle"></i> {{ $ts.sensitive }}</b>
		<span>{{ $ts.clickToShow }}</span>
	</div>
</div>
<div v-else class="mk-media-audio">
	<vue-plyr>
		<audio
			ref="audioEl"
			class="audio"
			:src="audio.url"
			:title="audio.name"
			controls
			preload="metadata"
			@volumechange="volumechange"
		/>
	</vue-plyr>
	<i class="ti ti-eye-off" @click="hide = true"></i>
</div>
</template>
	
<script lang="ts" setup>
import { ref } from 'vue';
import { onMounted } from 'vue';
import * as misskey from 'misskey-js';
import VuePlyr from 'vue-plyr';
import { defaultStore, ColdDeviceStorage } from '@/store';
import 'vue-plyr/dist/vue-plyr.css';

const props = defineProps<{
	audio: misskey.entities.DriveFile;
}>();

const hide = ref((defaultStore.state.nsfw === 'force') ? true : props.audio.isSensitive && (defaultStore.state.nsfw !== 'ignore'));

const audioEl = $shallowRef<HTMLAudioElement | null>();

const volumechange = () => {
	if (audioEl) ColdDeviceStorage.set('mediaVolume', audioEl.volume);
}

onMounted(() => {
	if (audioEl) audioEl.volume = ColdDeviceStorage.get('mediaVolume');
});
</script>
	
<style lang="scss" scoped>
.mk-media-audio {
	position: relative;

	--plyr-color-main: var(--accent);

	> i {
		display: block;
		position: absolute;
		border-radius: 6px;
		background-color: var(--fg);
		color: var(--accentLighten);
		font-size: 14px;
		opacity: .5;
		padding: 3px 6px;
		text-align: center;
		cursor: pointer;
		top: 12px;
		right: 12px;
	}

	> audio {
		display: flex;
		justify-content: center;
		align-items: center;

		font-size: 3.5em;
		overflow: hidden;
		background-position: center;
		background-size: cover;
		width: 100%;
		height: 100%;
	}
}

.mk-media-audio-cw {
	display: flex;
	justify-content: center;
	align-items: center;
	background: #111;
	color: #fff;

	> div {
		display: table-cell;
		text-align: center;
		font-size: 12px;

		> b {
			display: block;
		}
	}
}
</style>

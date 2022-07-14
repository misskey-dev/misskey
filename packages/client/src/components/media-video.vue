<template>
<div v-if="hide" class="icozogqfvdetwohsdglrbswgrejoxbdj" @click="hide = false">
	<div>
		<b><i class="fas fa-exclamation-triangle"></i> {{ $ts.sensitive }}</b>
		<span>{{ $ts.clickToShow }}</span>
	</div>
</div>
<div v-else class="kkjnbbplepmiyuadieoenjgutgcmtsvu">
	<video
		id="player"
		ref="videoEl"
		:poster="video.thumbnailUrl"
		:title="video.comment"
		:alt="video.comment"
		class="vlite-js"
		preload="none"
		controls
		@contextmenu.stop
	>
		<source
			:src="video.url"
			:type="video.type"
		>
	</video>
	<i class="fas fa-eye-slash" @click="hide = true"></i>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import * as misskey from 'misskey-js';
import 'vlitejs/dist/vlite.css';
import Vlitejs from 'vlitejs';
import VlitejsPip from 'vlitejs/dist/plugins/pip';
import { defaultStore } from '@/store';

const props = defineProps<{
	video: misskey.entities.DriveFile;
}>();

const videoEl = $ref<HTMLVideoElement | null>();
try {
	Vlitejs.registerPlugin('pip', VlitejsPip);
}
catch (err) {
	console.error('Pip plugin is already registered');
}

const playerInstance = ref();

onMounted(() => {
	if (videoEl) {
		playerInstance.value = new Vlitejs(videoEl, {
			plugins: ['pip'],
		});
	}
});

const hide = ref((defaultStore.state.nsfw === 'force') ? true : props.video.isSensitive && (defaultStore.state.nsfw !== 'ignore'));
</script>

<style lang="scss" scoped>
.kkjnbbplepmiyuadieoenjgutgcmtsvu {
	position: relative;

	> .vlite-js {
		--vlite-colorPrimary: var(--accent);
		--vlite-controlsColor: var(--fg);
	}

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

	> video {
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

.icozogqfvdetwohsdglrbswgrejoxbdj {
	display: flex;
	justify-content: center;
	align-items: center;
	/* background: #111;
	color: #fff; */

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

<template>
<div class="mk-media-banner">
	<div v-if="media.isSensitive && hide" class="sensitive" @click="hide = false">
		<span class="icon"><i class="ti ti-alert-triangle"></i></span>
		<b>{{ i18n.ts.sensitive }}</b>
		<span>{{ i18n.ts.clickToShow }}</span>
	</div>
	<div v-else-if="media.type.startsWith('audio') && media.type !== 'audio/midi'" class="audio">
		<VuePlyr :options="{ volume: 0.5 }">
			<audio controls preload="metadata">
				<source
					:src="media.url"
					:type="media.type"
				/>
			</audio>
		</VuePlyr>
	</div>
	<a
		v-else class="download"
		:href="media.url"
		:title="media.name"
		:download="media.name"
	>
		<span class="icon"><i class="ti ti-download"></i></span>
		<b>{{ media.name }}</b>
	</a>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import * as misskey from 'misskey-js';
import VuePlyr from 'vue-plyr';
import { soundConfigStore } from '@/scripts/sound';
import 'vue-plyr/dist/vue-plyr.css';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	media: misskey.entities.DriveFile;
}>(), {
});

const audioEl = $shallowRef<HTMLAudioElement | null>();
let hide = $ref(true);

function volumechange() {
	if (audioEl) soundConfigStore.set('mediaVolume', audioEl.volume);
}

onMounted(() => {
	if (audioEl) audioEl.volume = soundConfigStore.state.mediaVolume;
});
</script>

<style lang="scss" scoped>
.mk-media-banner {
	width: 100%;
	border-radius: 4px;
	margin-top: 4px;
	// overflow: clip;

	--plyr-color-main: var(--accent);
	--plyr-audio-controls-background: var(--bg);
	--plyr-audio-controls-color: var(--accentLighten);

	> .download,
	> .sensitive {
		display: flex;
		align-items: center;
		font-size: 12px;
		padding: 8px 12px;
		white-space: nowrap;

		> * {
			display: block;
		}

		> b {
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> *:not(:last-child) {
			margin-right: .2em;
		}

		> .icon {
			font-size: 1.6em;
		}
	}

	> .download {
		background: var(--noteAttachedFile);
	}

	> .sensitive {
		background: #111;
		color: #fff;
	}

	> .audio {
		border-radius: 8px;
		// overflow: clip;
	}
}
</style>

<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div v-if="media.isSensitive && hide" :class="$style.sensitive" @click="showHiddenContent">
		<span style="font-size: 1.6em;"><i class="ti ti-alert-triangle"></i></span>
		<b>{{ i18n.ts.sensitive }}</b>
		<span>{{ i18n.ts.clickToShow }}</span>
	</div>
	<MkMediaAudio v-else-if="media.type.startsWith('audio') && media.type !== 'audio/midi'" :audio="media" :user="user"/>
	<a
		v-else :class="$style.download"
		:href="media.url"
		:title="media.name"
		:download="media.name"
	>
		<span style="font-size: 1.6em;"><i class="ti ti-download"></i></span>
		<b>{{ media.name }}</b>
	</a>
</div>
</template>

<script lang="ts" setup>
import { shallowRef, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import MkMediaAudio from '@/components/MkMediaAudio.vue';
import { pleaseLogin } from '@/scripts/please-login.js';
import { $i } from '@/account.js';

const props = withDefaults(defineProps<{
	media: Misskey.entities.DriveFile;
	user?: Misskey.entities.UserLite;
}>(), {
});

const audioEl = shallowRef<HTMLAudioElement>();
const hide = ref(true);

function showHiddenContent(ev: MouseEvent) {
	if (props.media.isSensitive && !$i) {
		ev.preventDefault();
		ev.stopPropagation();
		pleaseLogin();
		return;
	}

	if (hide.value) {
		ev.preventDefault();
		ev.stopPropagation();
		hide.value = false;
	}
}

watch(audioEl, () => {
	if (audioEl.value) {
		audioEl.value.volume = 0.3;
	}
});
</script>

<style lang="scss" module>
.root {
	width: 100%;
	border-radius: 4px;
	margin-top: 4px;
	overflow: clip;
}

.download,
.sensitive {
	display: flex;
	align-items: center;
	font-size: 12px;
	padding: 8px 12px;
	white-space: nowrap;
}

.download {
	background: var(--noteAttachedFile);
}

.sensitive {
	background: #111;
	color: #fff;
}

.audio {
	border-radius: 8px;
	overflow: clip;
}
</style>

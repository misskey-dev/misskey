<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow :initialWidth="640" :initialHeight="402" :canResize="true" :closeButton="true" @closed="emit('closed')">
	<template #header>
		<i class="icon ti ti-player-play" style="margin-right: 0.5em;"></i>
		<span>{{ title ?? i18n.ts.video }}</span>
	</template>

	<div :class="$style.root">
		<MkLoading v-if="fetching"/>
		<MkExternalPlayer v-else-if="player?.url != null" :player="player" :title="title"/>
		<MkError v-else @retry="ytFetch()"/>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { versatileLang } from '@@/js/intl-const.js';
import type { SummalyResult } from '@misskey-dev/summaly';
import MkWindow from '@/components/MkWindow.vue';
import MkExternalPlayer from '@/components/MkExternalPlayer.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	urlOrSummalyResult: string | SummalyResult;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const fetching = ref(true);
const title = ref<string | null>(null);
const player = ref<SummalyResult['player'] | null>(null);

async function ytFetch() {
	title.value = null;
	player.value = null;
	fetching.value = true;

	let info: SummalyResult;

	if (typeof props.urlOrSummalyResult === 'string') {
		const requestUrl = new URL(props.urlOrSummalyResult, window.location.href);
		if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
			// Invalid URL
			fetching.value = false;
			return;
		}

		const res = await window.fetch(`/url?url=${encodeURIComponent(requestUrl.href)}&lang=${versatileLang}`);
		info = await res.json() as SummalyResult;
	} else {
		info = props.urlOrSummalyResult;
	}

	if (info.player.url == null) {
		// No URL or player info
		fetching.value = false;
		return;
	}

	if (!info.player.url.startsWith('https://') && !info.player.url.startsWith('http://')) {
		// Invalid player URL
		fetching.value = false;
		return;
	}

	title.value = info.title;
	player.value = info.player;
	fetching.value = false;
}

void ytFetch();
</script>

<style lang="scss" module>
.root {
	position: relative;
	overflow: hidden;
	height: 100%;
}
</style>

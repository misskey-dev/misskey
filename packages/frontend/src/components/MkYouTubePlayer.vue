<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow :initialWidth="640" :initialHeight="402" :canResize="true" :closeButton="true" @closed="emit('closed')">
	<template #header>
		<i class="icon ti ti-brand-youtube" style="margin-right: 0.5em;"></i>
		<span>{{ title ?? 'YouTube' }}</span>
	</template>

	<div class="poamfof">
		<MkLoading v-if="fetching || !iframeLoaded"/>
		<div v-if="!fetching && player?.url != null" class="player">
			<iframe
				:src="transformPlayerUrl(player.url)"
				frameborder="0"
				:allow="player.allow.join('; ')"
				allowfullscreen
				:style="{ opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.3s' }"
				@load="onFrameLoad"
			></iframe>
		</div>
		<MkError v-else @retry="ytFetch()"/>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { versatileLang } from '@@/js/intl-const.js';
import MkWindow from '@/components/MkWindow.vue';
import { transformPlayerUrl } from '@/utility/url-preview.js';
import type { SummalyResult } from '@misskey-dev/summaly';

const props = defineProps<{
	urlOrSummalyResult: string | SummalyResult;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const fetching = ref(true);
const iframeLoaded = ref(false);
const title = ref<string | null>(null);
const player = ref<SummalyResult['player'] | null>(null);

async function ytFetch() {
	title.value = null;
	player.value = null;
	fetching.value = true;
	iframeLoaded.value = false;

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

	if (info.url == null || info.player?.url == null) {
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

const onFrameLoad = (): void => {
	iframeLoaded.value = true;
};

void ytFetch();
</script>

<style lang="scss">
.poamfof {
	position: relative;
	overflow: hidden;
	height: 100%;

	.player {
		position: absolute;
		inset: 0;

		iframe {
			width: 100%;
			height: 100%;
		}
	}
}
</style>

<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="[
		$style.rootForEmbedPage,
		{
			[$style.rounded]: embedRounded,
			[$style.noBorder]: embedNoBorder,
		}
	]"
	:style="maxHeight > 0 ? { maxHeight: `${maxHeight}px`, '--embedMaxHeight': `${maxHeight}px` } : {}"
>
	<div
		:class="$style.routerViewContainer"
	>
		<Suspense :timeout="0">
			<EmNotePage v-if="page === 'notes'" :noteId="contentId"/>
			<EmUserTimelinePage v-else-if="page === 'user-timeline'" :userId="contentId"/>
			<EmClipPage v-else-if="page === 'clips'" :clipId="contentId"/>
			<EmTagPage v-else-if="page === 'tags'" :tag="contentId"/>
			<XNotFound v-else/>
			<template #fallback>
				<EmLoading/>
			</template>
		</Suspense>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, onMounted, onUnmounted, inject } from 'vue';
import { postMessageToParentWindow } from '@/post-message.js';
import { DI } from '@/di.js';
import { defaultEmbedParams } from '@@/js/embed-page.js';
import EmNotePage from '@/pages/note.vue';
import EmUserTimelinePage from '@/pages/user-timeline.vue';
import EmClipPage from '@/pages/clip.vue';
import EmTagPage from '@/pages/tag.vue';
import XNotFound from '@/pages/not-found.vue';
import EmLoading from '@/components/EmLoading.vue';

function safeURIDecode(str: string): string {
	try {
		return decodeURIComponent(str);
	} catch {
		return str;
	}
}

const page = location.pathname.split('/')[2];
const contentId = safeURIDecode(location.pathname.split('/')[3]);
if (_DEV_) console.log(page, contentId);

const embedParams = inject(DI.embedParams, defaultEmbedParams);

//#region Embed Style
const embedRounded = ref(embedParams.rounded);
const embedNoBorder = ref(!embedParams.border);
const maxHeight = ref(embedParams.maxHeight ?? 0);
//#endregion

//#region Embed Resizer
const rootEl = shallowRef<HTMLElement | null>(null);

let previousHeight = 0;
const resizeObserver = new ResizeObserver(async () => {
	const height = rootEl.value!.scrollHeight + (embedNoBorder.value ? 0 : 2); // border 上下1px
	if (Math.abs(previousHeight - height) < 1) return; // 1px未満の変化は無視
	postMessageToParentWindow('misskey:embed:changeHeight', {
		height: (maxHeight.value > 0 && height > maxHeight.value) ? maxHeight.value : height,
	});
	previousHeight = height;
});
onMounted(() => {
	resizeObserver.observe(rootEl.value!);
});
onUnmounted(() => {
	resizeObserver.disconnect();
});
//#endregion
</script>

<style lang="scss" module>
.rootForEmbedPage {
	box-sizing: border-box;
	border: 1px solid var(--MI_THEME-divider);
	background-color: var(--MI_THEME-bg);
	overflow: hidden;
	position: relative;
	height: auto;

	&.rounded {
		border-radius: var(--MI-radius);
	}

	&.noBorder {
		border: none;
	}
}

.routerViewContainer {
	container-type: inline-size;
	max-height: var(--embedMaxHeight, none);
}
</style>

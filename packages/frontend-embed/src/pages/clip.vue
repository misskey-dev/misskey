<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<EmTimelineContainer v-if="clip" :showHeader="embedParams.header">
		<template #header>
			<div :class="$style.clipHeader">
				<div :class="$style.headerClipIconRoot">
					<i class="ti ti-paperclip"></i>
				</div>
				<div :class="$style.headerTitle" @click="top">
					<div class="_nowrap"><a :href="`/clips/${clip.id}`" target="_blank" rel="noopener">{{ clip.name }}</a></div>
					<div :class="$style.sub">{{ i18n.tsx.fromX({ x: instanceName }) }}</div>
				</div>
				<a :href="url" :class="$style.instanceIconLink" target="_blank" rel="noopener noreferrer">
					<img
						:class="$style.instanceIcon"
						:src="serverMetadata.iconUrl || '/favicon.ico'"
					/>
				</a>
			</div>
		</template>
		<template #body>
			<EmNotes
				ref="notesEl"
				:pagination="pagination"
				:disableAutoLoad="!embedParams.autoload"
				:noGap="true"
				:ad="false"
			/>
		</template>
	</EmTimelineContainer>
	<XNotFound v-else/>
</div>
</template>

<script setup lang="ts">
import { ref, computed, inject, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { scrollToTop } from '@@/js/scroll.js';
import { url, instanceName } from '@@/js/config.js';
import { isLink } from '@@/js/is-link.js';
import { defaultEmbedParams } from '@@/js/embed-page.js';
import type { Paging } from '@/components/EmPagination.vue';
import EmNotes from '@/components/EmNotes.vue';
import XNotFound from '@/pages/not-found.vue';
import EmTimelineContainer from '@/components/EmTimelineContainer.vue';
import { misskeyApi } from '@/misskey-api.js';
import { i18n } from '@/i18n.js';
import { assertServerContext } from '@/server-context.js';
import { DI } from '@/di.js';

const props = defineProps<{
	clipId: string;
}>();

const embedParams = inject(DI.embedParams, defaultEmbedParams);

const serverMetadata = inject(DI.serverMetadata)!;

const serverContext = inject(DI.serverContext)!;

const clip = ref<Misskey.entities.Clip | null>();

if (assertServerContext(serverContext, 'clip')) {
	clip.value = serverContext.clip;
} else {
	clip.value = await misskeyApi('clips/show', {
		clipId: props.clipId,
	}).catch(() => {
		return null;
	});
}

const pagination = computed(() => ({
	endpoint: 'clips/notes',
	params: {
		clipId: props.clipId,
	},
} as Paging));

const notesEl = useTemplateRef('notesEl');

function top(ev: MouseEvent) {
	const target = ev.target as HTMLElement | null;
	if (target && isLink(target)) return;

	if (notesEl.value) {
		scrollToTop(notesEl.value.$el as HTMLElement, { behavior: 'smooth' });
	}
}
</script>

<style lang="scss" module>
.clipHeader {
	padding: 8px 16px;
	display: flex;
	min-width: 0;
	align-items: center;
	gap: var(--MI-margin);
	overflow: hidden;

	.headerClipIconRoot {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		line-height: 32px;
		font-size: 14px;
		text-align: center;
		background-color: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
		border-radius: 50%;
	}

	.headerTitle {
		flex-grow: 1;
		font-weight: 700;
		line-height: 1.1;
		min-width: 0;

		.sub {
			font-size: 0.8em;
			font-weight: 400;
			opacity: 0.7;
		}
	}

	.instanceIconLink {
		flex-shrink: 0;
		display: block;
		margin-left: auto;
		height: 24px;
	}

	.instanceIcon {
		height: 24px;
		border-radius: 3px;
	}
}
</style>

<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkLoading v-if="loading"/>
	<XEmbedTimelineUI v-else-if="clip" :showHeader="normalizedShowHeader">
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
						:src="instance.iconUrl || '/favicon.ico'"
					/>
				</a>
			</div>
		</template>
		<template #body>
			<MkNotes
				ref="notesEl"
				:pagination="pagination"
				:disableAutoLoad="!normalizedEnableAutoLoad"
				:noGap="true"
				:ad="false"
			/>
		</template>
	</XEmbedTimelineUI>
	<XNotFound v-else/>
</div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, inject, onActivated } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotes from '@/components/MkNotes.vue';
import XNotFound from '@/pages/not-found.vue';
import XEmbedTimelineUI from '@/pages/embed/_timeline_ui_.vue';
import type { Paging } from '@/components/MkPagination.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { url, instanceName } from '@/config.js';
import { scrollToTop } from '@/scripts/scroll.js';
import { isLink } from '@/scripts/is-link.js';
import { useRouter } from '@/router/supplier.js';

const props = defineProps<{
	clipId: string;
	showHeader?: string;
	enableAutoLoad?: string;
}>();

function redirectIfNotEmbedPage() {
	const inEmbedPage = inject<boolean>('EMBED_PAGE', false);

	if (!inEmbedPage) {
		const router = useRouter();
		router.replace(`/clips/${props.clipId}`);
	}
}

redirectIfNotEmbedPage();

onActivated(redirectIfNotEmbedPage);

// デフォルト: true
const normalizedShowHeader = computed(() => props.showHeader !== 'false');

// デフォルト: false
const normalizedEnableAutoLoad = computed(() => props.enableAutoLoad === 'true');

const clip = ref<Misskey.entities.Clip | null>(null);
const pagination = computed(() => ({
	endpoint: 'clips/notes',
	params: {
		clipId: props.clipId,
	},
} as Paging));
const loading = ref(true);

const notesEl = shallowRef<InstanceType<typeof MkNotes> | null>(null);

function top(ev: MouseEvent) {
	const target = ev.target as HTMLElement | null;
	if (target && isLink(target)) return;

	if (notesEl.value) {
		scrollToTop(notesEl.value.$el as HTMLElement, { behavior: 'smooth' });
	}
}

misskeyApi('clips/show', {
	clipId: props.clipId,
}).then(res => {
	clip.value = res;
	loading.value = false;
}).catch(err => {
	console.error(err);
	loading.value = false;
});
</script>

<style lang="scss" module>
.clipHeader {
	padding: 8px 16px;
	display: flex;
	min-width: 0;
	align-items: center;
	gap: var(--margin);
	overflow: hidden;

	.headerClipIconRoot {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		line-height: 32px;
		font-size: 14px;
		text-align: center;
		background-color: var(--accentedBg);
		color: var(--accent);
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
		border-radius: 4px;
	}
}
</style>

<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkLoading v-if="loading"/>
	<EmTimelineContainer v-else-if="user" :showHeader="embedParams.header">
		<template #header>
			<div :class="$style.userHeader">
				<a :href="`/@${user.username}`" target="_blank" rel="noopener noreferrer" :class="$style.avatarLink">
					<MkAvatar :class="$style.avatar" :user="user"/>
				</a>
				<div :class="$style.headerTitle" @click="top">
					<I18n :src="i18n.ts.noteOf" tag="div" class="_nowrap">
						<template #user>
							<a v-if="user != null" :href="`/@${user.username}`" target="_blank" rel="noopener noreferrer">
								<MkUserName :user="user"/>
							</a>
							<span v-else>{{ i18n.ts.user }}</span>
						</template>
					</I18n>
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
import { ref, computed, shallowRef, inject, onActivated } from 'vue';
import * as Misskey from 'misskey-js';
import type { Paging } from '@/components/MkPagination.vue';
import type { ParsedEmbedParams } from '@/embed-page.js';
import EmNotes from '@/embed/components/EmNotes.vue';
import XNotFound from '@/pages/not-found.vue';
import EmTimelineContainer from '@/embed/components/EmTimelineContainer.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { url, instanceName } from '@/config.js';
import { scrollToTop } from '@/scripts/scroll.js';
import { isLink } from '@/scripts/is-link.js';
import { defaultEmbedParams } from '@/embed-page.js';

const props = defineProps<{
	username: string;
}>();

redirectIfNotEmbedPage();

onActivated(redirectIfNotEmbedPage);

const embedParams = inject<ParsedEmbedParams>('embedParams', defaultEmbedParams);

const user = ref<Misskey.entities.UserLite | null>(null);
const pagination = computed(() => ({
	endpoint: 'users/notes',
	params: {
		userId: user.value?.id,
	},
} as Paging));
const loading = ref(true);

const notesEl = shallowRef<InstanceType<typeof EmNotes> | null>(null);

function top(ev: MouseEvent) {
	const target = ev.target as HTMLElement | null;
	if (target && isLink(target)) return;

	if (notesEl.value) {
		scrollToTop(notesEl.value.$el as HTMLElement, { behavior: 'smooth' });
	}
}

misskeyApi('users/show', {
	username: props.username,
}).then(res => {
	user.value = res;
	loading.value = false;
}).catch(err => {
	console.error(err);
	loading.value = false;
});
</script>

<style lang="scss" module>
.userHeader {
	padding: 8px 16px;
	display: flex;
	min-width: 0;
	align-items: center;
	gap: var(--margin);
	overflow: hidden;

	.avatarLink {
		display: block;
	}

	.avatar {
		display: inline-block;
		width: 32px;
		height: 32px;
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

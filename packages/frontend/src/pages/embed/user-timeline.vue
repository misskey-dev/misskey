<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div :class="$style.userTimelineRoot">
		<MkLoading v-if="loading"/>
		<template v-else-if="user">
			<div v-if="normalizedShowHeader" :class="$style.userHeader">
				<a :href="`/@${user.username}`" target="_blank" rel="noopener noreferrer" :class="$style.avatarLink">
					<MkAvatar :class="$style.avatar" :user="user"/>
				</a>
				<div :class="$style.headerTitle" @click="top">
					<I18n :src="i18n.ts.noteOf" tag="div">
						<template #user>
							<a :href="`/@${user.username}`" target="_blank" rel="noopener noreferrer">
								<Mfm :text="user.name ?? `@${user.username}`" :plain="true"/>
							</a>
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
			<MkNotes
				ref="notesEl"
				:class="$style.userTimelineNotes"
				:pagination="pagination"
				:disableAutoLoad="!normalizedEnableAutoLoad"
				:noGap="true"
				:ad="false"
			/>
		</template>
		<XNotFound v-else/>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotes from '@/components/MkNotes.vue';
import XNotFound from '@/pages/not-found.vue';
import type { Paging } from '@/components/MkPagination.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { url, instanceName } from '@/config.js';
import { scrollToTop } from '@/scripts/scroll.js';
import { isLink } from '@/scripts/is-link.js';

const props = defineProps<{
	username: string;
	showHeader?: string;
	enableAutoLoad?: string;
}>();

// デフォルト: true
const normalizedShowHeader = computed(() => props.showHeader !== 'false');

// デフォルト: false
const normalizedEnableAutoLoad = computed(() => props.enableAutoLoad === 'true');

const user = ref<Misskey.entities.UserLite | null>(null);
const pagination = computed(() => ({
	endpoint: 'users/notes',
	params: {
		userId: user.value?.id,
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
.userTimelineRoot {
	background-color: var(--panel);
	height: 100%;
	max-height: var(--embedMaxHeight, none);
	display: flex;
	flex-direction: column;
}

.userHeader {
	flex-shrink: 0;
	padding: 8px 16px;
	display: flex;
	align-items: center;
	gap: var(--margin);
	border-bottom: 1px solid var(--divider);
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

.userTimelineNotes {
	flex: 1;
	overflow-y: auto;
}
</style>

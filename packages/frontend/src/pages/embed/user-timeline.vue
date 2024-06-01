<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div :class="$style.userTimelineRoot">
		<MkLoading v-if="loading"/>
		<template v-else-if="user">
			<div v-if="normalizedShowHeader" :class="$style.userHeader">
				<MkAvatar :user="user"/>{{ user.name }} のノート
			</div>
			<MkNotes :class="$style.userTimelineNotes" :pagination="pagination" :noGap="true"/>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotes from '@/components/MkNotes.vue';
import type { Paging } from '@/components/MkPagination.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';

const props = defineProps<{
	username: string;
	showHeader?: string;
}>();

const normalizedShowHeader = computed(() => props.showHeader !== 'false');

const user = ref<Misskey.entities.UserLite | null>(null);
const pagination = computed(() => ({
	endpoint: 'users/notes',
	params: {
		userId: user.value?.id,
	},
} as Paging));
const loading = ref(true);

misskeyApi('users/show', {
	username: props.username,
}).then(res => {
	user.value = res;
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

.userTimelineNotes {
	flex: 1;
	overflow-y: auto;
}
</style>

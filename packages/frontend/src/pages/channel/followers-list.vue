<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkPagination v-slot="{items}" ref="list" :pagination="followersPagination">
		<div :class="$style.users">
			<MkUserInfo v-for="user in items.map(x => x.follower)" :key="user.id" :user="user"/>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkUserInfo from '@/components/MkUserInfo.vue';
import MkPagination from '@/components/MkPagination.vue';

const props = defineProps<{
	channelId: string;
}>();

const followersPagination = {
	endpoint: 'channels/followers' as const,
	limit: 20,
	params: computed(() => ({
		channelId: props.channelId,
	})),
};
</script>

<style lang="scss" module>
.users {
    display: grid;
    /* auto-fillを使いつつ、標準的なユーザーカード幅を使用 */
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    grid-gap: var(--MI-margin);
}
</style>

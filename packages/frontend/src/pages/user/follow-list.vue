<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkPagination v-slot="{items}" :paginator="type === 'following' ? followingPaginator : followersPaginator" withControl>
		<div :class="$style.users">
			<MkUserInfo v-for="user in items.map(x => type === 'following' ? x.followee! : x.follower!)" :key="user.id" :user="user"/>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkUserInfo from '@/components/MkUserInfo.vue';
import MkPagination from '@/components/MkPagination.vue';
import { Paginator } from '@/utility/paginator.js';

const props = defineProps<{
	user: Misskey.entities.User;
	type: 'following' | 'followers';
}>();

const followingPaginator = markRaw(new Paginator('users/following', {
	limit: 20,
	computedParams: computed(() => ({
		userId: props.user.id,
	})),
}));

const followersPaginator = markRaw(new Paginator('users/followers', {
	limit: 20,
	computedParams: computed(() => ({
		userId: props.user.id,
	})),
}));
</script>

<style lang="scss" module>
.users {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--MI-margin);
}
</style>

<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<Transition :name="defaultStore.state.animation ? '_transition_zoom' : ''" mode="out-in">
		<MkLoading v-if="fetching"/>
		<div v-else class="users">
			<MkA v-for="(user, i) in newUsers" :key="user.id" :to="`/admin/user/${user.id}`" class="user">
				<MkUserCardMini :user="user"/>
			</MkA>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import { defaultStore } from '@/store.js';

const newUsers = ref<Misskey.entities.UserDetailed[] | null>(null);
const fetching = ref(true);

const fetch = async () => {
	const _newUsers = await misskeyApi('admin/show-users', {
		limit: 5,
		sort: '+createdAt',
		origin: 'local',
	});
	newUsers.value = _newUsers;
	fetching.value = false;
};

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});
</script>

<style lang="scss" module>
.root {
	&:global {
		> .users {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			grid-gap: 12px;

			.chart-move {
				transition: transform 1s ease;
			}

			> .user:hover {
				text-decoration: none;
			}
		}
	}
}
</style>

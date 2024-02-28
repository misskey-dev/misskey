<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<Transition :name="defaultStore.state.animation ? '_transition_zoom' : ''" mode="out-in">
		<MkLoading v-if="fetching"/>
		<div v-else :class="$style.root" class="_panel">
			<MkA v-for="user in moderators" :key="user.id" class="user" :to="`/admin/user/${user.id}`">
				<MkAvatar :user="user" class="avatar" indicator/>
			</MkA>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import * as Misskey from 'misskey-js';
import { defaultStore } from '@/store.js';

const moderators = ref<Misskey.entities.UserDetailed[] | null>(null);
const fetching = ref(true);

onMounted(async () => {
	moderators.value = await misskeyApi('admin/show-users', {
		sort: '+lastActiveDate',
		state: 'adminOrModerator',
		limit: 30,
	});

	fetching.value = false;
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(30px, 40px));
	grid-gap: 12px;
	place-content: center;
	padding: 12px;

	&:global {
		> .user {
			width: 100%;
			height: 100%;
			aspect-ratio: 1;

			> .avatar {
				width: 100%;
				height: 100%;
			}
		}
	}
}
</style>

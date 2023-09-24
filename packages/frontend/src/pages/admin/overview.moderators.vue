<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
import { onMounted } from 'vue';
import * as os from '@/os.js';
import { defaultStore } from '@/store.js';

let moderators: any = $ref(null);
let fetching = $ref(true);

onMounted(async () => {
	moderators = await os.api('admin/show-users', {
		sort: '+lastActiveDate',
		state: 'adminOrModerator',
		limit: 30,
	});

	fetching = false;
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

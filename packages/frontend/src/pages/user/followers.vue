<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="1000">
		<Transition name="fade" mode="out-in">
			<div v-if="user">
				<XFollowList :user="user" type="followers"/>
			</div>
			<MkError v-else-if="error" @retry="fetchUser()"/>
			<MkLoading v-else/>
		</Transition>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XFollowList from './follow-list.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	acct: string;
}>(), {
});

const user = ref<null | Misskey.entities.UserDetailed>(null);
const error = ref<any>(null);

function fetchUser(): void {
	if (props.acct == null) return;
	user.value = null;
	misskeyApi('users/show', Misskey.acct.parse(props.acct)).then(u => {
		user.value = u;
	}).catch(err => {
		error.value = err;
	});
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.user,
	icon: 'ti ti-user',
	...user.value ? {
		title: user.value.name ? `${user.value.name} (@${user.value.username})` : `@${user.value.username}`,
		subtitle: i18n.ts.followers,
		userName: user.value,
		avatar: user.value,
	} : {},
}));
</script>

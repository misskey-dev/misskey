<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="1000">
		<transition name="fade" mode="out-in">
			<div v-if="user">
				<XFollowList :user="user" type="followers"/>
			</div>
			<MkError v-else-if="error" @retry="fetchUser()"/>
			<MkLoading v-else/>
		</transition>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, computed, inject, onMounted, onUnmounted, watch } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import * as misskey from 'misskey-js';
import XFollowList from './follow-list.vue';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	acct: string;
}>(), {
});

let user = $ref<null | misskey.entities.UserDetailed>(null);
let error = $ref(null);

function fetchUser(): void {
	if (props.acct == null) return;
	user = null;
	os.api('users/show', Acct.parse(props.acct)).then(u => {
		user = u;
	}).catch(err => {
		error = err;
	});
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => user ? {
	icon: 'fas fa-user',
	title: user.name ? `${user.name} (@${user.username})` : `@${user.username}`,
	subtitle: i18n.ts.followers,
	userName: user,
	avatar: user,
} : null));
</script>

<style lang="scss" scoped>
</style>

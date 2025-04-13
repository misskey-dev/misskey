<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<MkPolkadots v-if="tab === 'home'" accented/>
	<MkSpacer :contentMax="700">
		<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
			<XHome v-if="tab === 'home'"/>
			<XInvitations v-else-if="tab === 'invitations'"/>
			<XJoiningRooms v-else-if="tab === 'joiningRooms'"/>
			<XOwnedRooms v-else-if="tab === 'ownedRooms'"/>
		</MkHorizontalSwipe>
	</MkSpacer>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import XHome from './home.home.vue';
import XInvitations from './home.invitations.vue';
import XJoiningRooms from './home.joiningRooms.vue';
import XOwnedRooms from './home.ownedRooms.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import MkPolkadots from '@/components/MkPolkadots.vue';

const tab = ref('home');

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'home',
	title: i18n.ts._chat.home,
	icon: 'ti ti-home',
}, {
	key: 'invitations',
	title: i18n.ts._chat.invitations,
	icon: 'ti ti-ticket',
}, {
	key: 'joiningRooms',
	title: i18n.ts._chat.joiningRooms,
	icon: 'ti ti-users-group',
}, {
	key: 'ownedRooms',
	title: i18n.ts._chat.yourRooms,
	icon: 'ti ti-settings',
}]);

definePage(() => ({
	title: i18n.ts.chat + ' (beta)',
	icon: 'ti ti-messages',
}));
</script>

<style lang="scss" module>
</style>

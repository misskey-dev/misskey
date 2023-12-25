<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkFolder v-for="x in statusbars" :key="x.id">
		<template #label>{{ x.type ?? i18n.ts.notSet }}</template>
		<template #suffix>{{ x.name }}</template>
		<XStatusbar :_id="x.id" :userLists="userLists"/>
	</MkFolder>
	<MkButton primary @click="add">{{ i18n.ts.add }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import XStatusbar from './statusbar.statusbar.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const statusbars = defaultStore.reactiveState.statusbars;

const userLists = ref<Misskey.entities.UserList[] | null>(null);

onMounted(() => {
	os.api('users/lists/list').then(res => {
		userLists.value = res;
	});
});

async function add() {
	defaultStore.push('statusbars', {
		id: uuid(),
		type: null,
		black: false,
		size: 'medium',
		props: {},
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.statusbar,
	icon: 'ti ti-list',
});
</script>

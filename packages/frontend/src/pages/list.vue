<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer v-if="error != null" :contentMax="1200">
		<div :class="$style.root">
			<img :class="$style.img" :src="serverErrorImageUrl" class="_ghost"/>
			<p :class="$style.text">
				<i class="ti ti-alert-triangle"></i>
				{{ i18n.ts.nothing }}
			</p>
		</div>
	</MkSpacer>
	<MkSpacer v-else-if="list" :contentMax="700" :class="$style.main">
		<div v-if="list" class="members _margin">
			<div :class="$style.member_text">{{ i18n.ts.members }}</div>
			<div class="_gaps_s">
				<div v-for="user in users" :key="user.id" :class="$style.userItem">
					<MkA :class="$style.userItemBody" :to="`${userPage(user)}`">
						<MkUserCardMini :user="user"/>
					</MkA>
				</div>
			</div>
		</div>
		<MkButton v-if="list.isLiked" v-tooltip="i18n.ts.unlike" inline :class="$style.button" asLike primary @click="unlike()"><i class="ti ti-heart-off"></i><span v-if="list.likedCount > 0" class="count">{{ list.likedCount }}</span></MkButton>
		<MkButton v-if="!list.isLiked" v-tooltip="i18n.ts.like" inline :class="$style.button" asLike @click="like()"><i class="ti ti-heart"></i><span v-if="1 > 0" class="count">{{ list.likedCount }}</span></MkButton>
		<MkButton inline @click="create()"><i class="ti ti-download" :class="$style.import"></i>{{ i18n.ts.import }}</MkButton>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { watch, computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { userPage } from '@/filters/user.js';
import { i18n } from '@/i18n.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkButton from '@/components/MkButton.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { serverErrorImageUrl } from '@/instance.js';

const props = defineProps<{
	listId: string;
}>();

const list = ref<Misskey.entities.UserList | null>(null);
const error = ref<unknown | null>(null);
const users = ref<Misskey.entities.UserDetailed[]>([]);

function fetchList(): void {
	misskeyApi('users/lists/show', {
		listId: props.listId,
		forPublic: true,
	}).then(_list => {
		list.value = _list;
		misskeyApi('users/show', {
			userIds: list.value.userIds,
		}).then(_users => {
			users.value = _users;
		});
	}).catch(err => {
		error.value = err;
	});
}

function like() {
	os.apiWithDialog('users/lists/favorite', {
		listId: list.value.id,
	}).then(() => {
		list.value.isLiked = true;
		list.value.likedCount++;
	});
}

function unlike() {
	os.apiWithDialog('users/lists/unfavorite', {
		listId: list.value.id,
	}).then(() => {
		list.value.isLiked = false;
		list.value.likedCount--;
	});
}

async function create() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.enterListName,
	});
	if (canceled) return;
	await os.apiWithDialog('users/lists/create-from-public', { name: name, listId: list.value.id });
}

watch(() => props.listId, fetchList, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: list.value ? list.value.name : i18n.ts.lists,
	icon: 'ti ti-list',
}));
</script>
<style lang="scss" module>
.main {
	min-height: calc(100cqh - (var(--MI-stickyTop, 0px) + var(--MI-stickyBottom, 0px)));
}

.userItem {
	display: flex;
}

.userItemBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;

	&:hover {
		text-decoration: none;
	}
}
.member_text {
	margin: 5px;
}

.root {
	padding: 32px;
	text-align: center;
  align-items: center;
}

.text {
	margin: 0 0 8px 0;
}

.img {
	vertical-align: bottom;
  width: 128px;
	height: 128px;
	margin-bottom: 16px;
	border-radius: 16px;
}

.button {
	margin-right: 10px;
}

.import {
	margin-right: 4px;
}
</style>

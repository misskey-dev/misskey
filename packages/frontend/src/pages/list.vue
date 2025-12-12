<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div v-if="error != null" class="_spacer" style="--MI_SPACER-w: 1200px;">
		<MkResult type="error"/>
	</div>
	<div v-else-if="list" class="_spacer" style="--MI_SPACER-w: 700px;">
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
		<MkButton v-if="list.isLiked" v-tooltip="i18n.ts.unlike" inline :class="$style.button" asLike primary @click="unlike()"><i class="ti ti-heart-off"></i><span v-if="list.likedCount != null && list.likedCount > 0" class="count">{{ list.likedCount }}</span></MkButton>
		<MkButton v-if="!list.isLiked" v-tooltip="i18n.ts.like" inline :class="$style.button" asLike @click="like()"><i class="ti ti-heart"></i><span v-if="1 > 0" class="count">{{ list.likedCount }}</span></MkButton>
		<MkButton inline @click="create()"><i class="ti ti-download" :class="$style.import"></i>{{ i18n.ts.import }}</MkButton>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { watch, computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { userPage } from '@/filters/user.js';
import { i18n } from '@/i18n.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkButton from '@/components/MkButton.vue';
import { definePage } from '@/page.js';

const props = defineProps<{
	listId: string;
}>();

const list = ref<Misskey.entities.UsersListsShowResponse | null>(null);
const error = ref<unknown | null>(null);
const users = ref<Misskey.entities.UserDetailed[]>([]);

function fetchList(): void {
	misskeyApi('users/lists/show', {
		listId: props.listId,
		forPublic: true,
	}).then(_list => {
		list.value = _list;
		if (_list.userIds == null || _list.userIds.length === 0) return;
		misskeyApi('users/show', {
			userIds: _list.userIds,
		}).then(_users => {
			users.value = _users;
		});
	}).catch(err => {
		error.value = err;
	});
}

function like() {
	if (list.value == null) return;
	os.apiWithDialog('users/lists/favorite', {
		listId: list.value.id,
	}).then(() => {
		if (list.value == null) return;
		list.value.isLiked = true;
		list.value.likedCount = (list.value.likedCount != null ? list.value.likedCount + 1 : 1);
	});
}

function unlike() {
	if (list.value == null) return;
	os.apiWithDialog('users/lists/unfavorite', {
		listId: list.value.id,
	}).then(() => {
		if (list.value == null) return;
		list.value.isLiked = false;
		list.value.likedCount = (list.value.likedCount != null ? Math.max(0, list.value.likedCount - 1) : 0);
	});
}

async function create() {
	if (list.value == null) return;
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.enterListName,
	});
	if (canceled || name == null) return;
	await os.apiWithDialog('users/lists/create-from-public', { name: name, listId: list.value.id });
}

watch(() => props.listId, fetchList, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: list.value ? list.value.name : i18n.ts.lists,
	icon: 'ti ti-list',
}));
</script>

<style lang="scss" module>
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

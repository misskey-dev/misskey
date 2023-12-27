<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700" :class="$style.main">
		<div v-if="list" class="_gaps">
			<MkFolder>
				<template #label>{{ i18n.ts.settings }}</template>

				<div class="_gaps">
					<MkInput v-model="name">
						<template #label>{{ i18n.ts.name }}</template>
					</MkInput>
					<MkSwitch v-model="isPublic">{{ i18n.ts.public }}</MkSwitch>
					<div class="_buttons">
						<MkButton rounded primary @click="updateSettings">{{ i18n.ts.save }}</MkButton>
						<MkButton rounded danger @click="deleteList()">{{ i18n.ts.delete }}</MkButton>
					</div>
				</div>
			</MkFolder>

			<MkFolder defaultOpen>
				<template #label>{{ i18n.ts.members }}</template>
				<template #caption>{{ i18n.t('nUsers', { n: `${list.userIds.length}/${$i?.policies['userEachUserListsLimit']}` }) }}</template>

				<div class="_gaps_s">
					<MkButton rounded primary style="margin: 0 auto;" @click="addUser()">{{ i18n.ts.addUser }}</MkButton>

					<MkPagination ref="paginationEl" :pagination="membershipsPagination">
						<template #default="{ items }">
							<div class="_gaps_s">
								<div v-for="item in items" :key="item.id">
									<div :class="$style.userItem">
										<MkA :class="$style.userItemBody" :to="`${userPage(item.user)}`">
											<MkUserCardMini :user="item.user"/>
										</MkA>
										<button class="_button" :class="$style.menu" @click="showMembershipMenu(item, $event)"><i class="ti ti-dots"></i></button>
										<button class="_button" :class="$style.remove" @click="removeUser(item, $event)"><i class="ti ti-x"></i></button>
									</div>
								</div>
							</div>
						</template>
					</MkPagination>
				</div>
			</MkFolder>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { mainRouter } from '@/router.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import { userPage } from '@/filters/user.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInput from '@/components/MkInput.vue';
import { userListsCache } from '@/cache.js';
import { $i } from '@/account.js';
import { defaultStore } from '@/store.js';
import MkPagination from '@/components/MkPagination.vue';

const {
	enableInfiniteScroll,
} = defaultStore.reactiveState;

const props = defineProps<{
	listId: string;
}>();

const paginationEl = ref<InstanceType<typeof MkPagination>>();
const list = ref<Misskey.entities.UserList | null>(null);
const isPublic = ref(false);
const name = ref('');
const membershipsPagination = {
	endpoint: 'users/lists/get-memberships' as const,
	limit: 30,
	params: computed(() => ({
		listId: props.listId,
	})),
};

function fetchList() {
	os.api('users/lists/show', {
		listId: props.listId,
	}).then(_list => {
		list.value = _list;
		name.value = list.value.name;
		isPublic.value = list.value.isPublic;
	});
}

function addUser() {
	os.selectUser().then(user => {
		if (!list.value) return;
		os.apiWithDialog('users/lists/push', {
			listId: list.value.id,
			userId: user.id,
		}).then(() => {
			paginationEl.value.reload();
		});
	});
}

async function removeUser(item, ev) {
	os.popupMenu([{
		text: i18n.ts.remove,
		icon: 'ti ti-x',
		danger: true,
		action: async () => {
			if (!list.value) return;
			os.api('users/lists/pull', {
				listId: list.value.id,
				userId: item.userId,
			}).then(() => {
				paginationEl.value.removeItem(item.id);
			});
		},
	}], ev.currentTarget ?? ev.target);
}

async function showMembershipMenu(item, ev) {
	os.popupMenu([{
		text: item.withReplies ? i18n.ts.hideRepliesToOthersInTimeline : i18n.ts.showRepliesToOthersInTimeline,
		icon: item.withReplies ? 'ti ti-messages-off' : 'ti ti-messages',
		action: async () => {
			os.api('users/lists/update-membership', {
				listId: list.value.id,
				userId: item.userId,
				withReplies: !item.withReplies,
			}).then(() => {
				paginationEl.value.updateItem(item.id, (old) => ({
					...old,
					withReplies: !item.withReplies,
				}));
			});
		},
	}], ev.currentTarget ?? ev.target);
}

async function deleteList() {
	if (!list.value) return;
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: list.value.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('users/lists/delete', {
		listId: list.value.id,
	});
	userListsCache.delete();
	mainRouter.push('/my/lists');
}

async function updateSettings() {
	if (!list.value) return;
	await os.apiWithDialog('users/lists/update', {
		listId: list.value.id,
		name: name.value,
		isPublic: isPublic.value,
	});

	userListsCache.delete();

	list.value.name = name.value;
	list.value.isPublic = isPublic.value;
}

watch(() => props.listId, fetchList, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(computed(() => list.value ? {
	title: list.value.name,
	icon: 'ti ti-list',
} : null));
</script>

<style lang="scss" module>
.main {
	min-height: calc(100cqh - (var(--stickyTop, 0px) + var(--stickyBottom, 0px)));
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

.remove {
	width: 32px;
	height: 32px;
	align-self: center;
}

.menu {
	width: 32px;
	height: 32px;
	align-self: center;
}

.more {
	margin-left: auto;
	margin-right: auto;
}

.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-top: solid 0.5px var(--divider);
}
</style>

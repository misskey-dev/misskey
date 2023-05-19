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

				<div class="_gaps_s">
					<MkButton rounded primary style="margin: 0 auto;" @click="addUser()">{{ i18n.ts.addUser }}</MkButton>
					<div v-for="user in users" :key="user.id" :class="$style.userItem">
						<MkA :class="$style.userItemBody" :to="`${userPage(user)}`">
							<MkUserCardMini :user="user"/>
						</MkA>
						<button class="_button" :class="$style.remove" @click="removeUser(user, $event)"><i class="ti ti-x"></i></button>
					</div>
				</div>
			</MkFolder>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { mainRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { userPage } from '@/filters/user';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInput from '@/components/MkInput.vue';
import { userListsCache } from '@/cache';

const props = defineProps<{
	listId: string;
}>();

let list = $ref(null);
let users = $ref([]);
const isPublic = ref(false);
const name = ref('');

function fetchList() {
	os.api('users/lists/show', {
		listId: props.listId,
	}).then(_list => {
		list = _list;
		name.value = list.name;
		isPublic.value = list.isPublic;

		os.api('users/show', {
			userIds: list.userIds,
		}).then(_users => {
			users = _users;
		});
	});
}

function addUser() {
	os.selectUser().then(user => {
		os.apiWithDialog('users/lists/push', {
			listId: list.id,
			userId: user.id,
		}).then(() => {
			users.push(user);
		});
	});
}

async function removeUser(user, ev) {
	os.popupMenu([{
		text: i18n.ts.remove,
		icon: 'ti ti-x',
		danger: true,
		action: async () => {
			os.api('users/lists/pull', {
				listId: list.id,
				userId: user.id,
			}).then(() => {
				users = users.filter(x => x.id !== user.id);
			});
		},
	}], ev.currentTarget ?? ev.target);
}

async function deleteList() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: list.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('users/lists/delete', {
		listId: list.id,
	});
	userListsCache.delete();
	mainRouter.push('/my/lists');
}

async function updateSettings() {
	await os.apiWithDialog('users/lists/update', {
		listId: list.id,
		name: name.value,
		isPublic: isPublic.value,
	});

	userListsCache.delete();

	list.name = name.value;
	list.isPublic = isPublic.value;
}

watch(() => props.listId, fetchList, { immediate: true });

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => list ? {
	title: list.name,
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

.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-top: solid 0.5px var(--divider);
}
</style>

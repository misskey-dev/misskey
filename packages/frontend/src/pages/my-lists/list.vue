<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div>
			<Transition :name="$store.state.animation ? '_transition_zoom' : ''" mode="out-in">
				<div v-if="list" class="">
					<div class="_buttons">
						<MkButton inline @click="addUser()">{{ i18n.ts.addUser }}</MkButton>
						<MkButton inline @click="renameList()">{{ i18n.ts.rename }}</MkButton>
						<MkButton inline danger @click="deleteList()">{{ i18n.ts.delete }}</MkButton>
					</div>
				</div>
			</Transition>

			<Transition :name="$store.state.animation ? '_transition_zoom' : ''" mode="out-in">
				<div v-if="list" class="members _margin">
					<div class="">{{ i18n.ts.members }}</div>
					<div class="_gaps_s">
						<div v-for="user in users" :key="user.id" :class="$style.userItem">
							<MkA :class="$style.userItemBody" :to="`${userPage(user)}`">
								<MkUserCardMini :user="user"/>
							</MkA>
							<button class="_button" :class="$style.remove" @click="removeUser(user, $event)"><i class="ti ti-x"></i></button>
						</div>
					</div>
				</div>
			</Transition>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { mainRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { userPage } from '@/filters/user';
import MkUserCardMini from '@/components/MkUserCardMini.vue';

const props = defineProps<{
	listId: string;
}>();

let list = $ref(null);
let users = $ref([]);

function fetchList() {
	os.api('users/lists/show', {
		listId: props.listId,
	}).then(_list => {
		list = _list;
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

async function renameList() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.enterListName,
		default: list.name,
	});
	if (canceled) return;

	await os.api('users/lists/update', {
		listId: list.id,
		name: name,
	});

	list.name = name;
}

async function deleteList() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: list.name }),
	});
	if (canceled) return;

	await os.api('users/lists/delete', {
		listId: list.id,
	});
	os.success();
	mainRouter.push('/my/lists');
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
</style>

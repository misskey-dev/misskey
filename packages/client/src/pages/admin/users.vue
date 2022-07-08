<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="900">
			<div class="lknzcolw">
				<div class="users">
					<div class="inputs">
						<MkSelect v-model="sort" style="flex: 1;">
							<template #label>{{ $ts.sort }}</template>
							<option value="-createdAt">{{ $ts.registeredDate }} ({{ $ts.ascendingOrder }})</option>
							<option value="+createdAt">{{ $ts.registeredDate }} ({{ $ts.descendingOrder }})</option>
							<option value="-updatedAt">{{ $ts.lastUsed }} ({{ $ts.ascendingOrder }})</option>
							<option value="+updatedAt">{{ $ts.lastUsed }} ({{ $ts.descendingOrder }})</option>
						</MkSelect>
						<MkSelect v-model="state" style="flex: 1;">
							<template #label>{{ $ts.state }}</template>
							<option value="all">{{ $ts.all }}</option>
							<option value="available">{{ $ts.normal }}</option>
							<option value="admin">{{ $ts.administrator }}</option>
							<option value="moderator">{{ $ts.moderator }}</option>
							<option value="silenced">{{ $ts.silence }}</option>
							<option value="suspended">{{ $ts.suspend }}</option>
						</MkSelect>
						<MkSelect v-model="origin" style="flex: 1;">
							<template #label>{{ $ts.instance }}</template>
							<option value="combined">{{ $ts.all }}</option>
							<option value="local">{{ $ts.local }}</option>
							<option value="remote">{{ $ts.remote }}</option>
						</MkSelect>
					</div>
					<div class="inputs">
						<MkInput v-model="searchUsername" style="flex: 1;" type="text" :spellcheck="false" @update:modelValue="$refs.users.reload()">
							<template #prefix>@</template>
							<template #label>{{ $ts.username }}</template>
						</MkInput>
						<MkInput v-model="searchHost" style="flex: 1;" type="text" :spellcheck="false" :disabled="pagination.params.origin === 'local'" @update:modelValue="$refs.users.reload()">
							<template #prefix>@</template>
							<template #label>{{ $ts.host }}</template>
						</MkInput>
					</div>

					<MkPagination v-slot="{items}" ref="paginationComponent" :pagination="pagination" class="users">
						<MkA v-for="user in items" :key="user.id" v-tooltip.mfm="`Last posted: ${new Date(user.updatedAt).toLocaleString()}`" class="user" :to="`/user-info/${user.id}`">
							<MkUserCardMini :user="user"/>
						</MkA>
					</MkPagination>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XHeader from './_header_.vue';
import MkInput from '@/components/form/input.vue';
import MkSelect from '@/components/form/select.vue';
import MkPagination from '@/components/ui/pagination.vue';
import * as os from '@/os';
import { lookupUser } from '@/scripts/lookup-user';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkUserCardMini from '@/components/user-card-mini.vue';

let paginationComponent = $ref<InstanceType<typeof MkPagination>>();

let sort = $ref('+createdAt');
let state = $ref('all');
let origin = $ref('local');
let searchUsername = $ref('');
let searchHost = $ref('');
const pagination = {
	endpoint: 'admin/show-users' as const,
	limit: 10,
	params: computed(() => ({
		sort: sort,
		state: state,
		origin: origin,
		username: searchUsername,
		hostname: searchHost,
	})),
	offsetMode: true,
};

function searchUser() {
	os.selectUser().then(user => {
		show(user);
	});
}

async function addUser() {
	const { canceled: canceled1, result: username } = await os.inputText({
		title: i18n.ts.username,
	});
	if (canceled1) return;

	const { canceled: canceled2, result: password } = await os.inputText({
		title: i18n.ts.password,
		type: 'password',
	});
	if (canceled2) return;

	os.apiWithDialog('admin/accounts/create', {
		username: username,
		password: password,
	}).then(res => {
		paginationComponent.reload();
	});
}

function show(user) {
	os.pageWindow(`/user-info/${user.id}`);
}

const headerActions = $computed(() => [{
	icon: 'fas fa-search',
	text: i18n.ts.search,
	handler: searchUser,
}, {
	asFullButton: true,
	icon: 'fas fa-plus',
	text: i18n.ts.addUser,
	handler: addUser,
}, {
	asFullButton: true,
	icon: 'fas fa-search',
	text: i18n.ts.lookup,
	handler: lookupUser,
}]);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.users,
	icon: 'fas fa-users',
})));
</script>

<style lang="scss" scoped>
.lknzcolw {
	> .users {

		> .inputs {
			display: flex;
			margin-bottom: 16px;

			> * {
				margin-right: 16px;

				&:last-child {
					margin-right: 0;
				}
			}
		}
	
		> .users {
			margin-top: var(--margin);
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
			grid-gap: 12px;

			> .user:hover {
				text-decoration: none;
			}
		}
	}
}
</style>

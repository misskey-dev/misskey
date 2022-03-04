<template>
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
			<MkInput v-model="searchUsername" style="flex: 1;" type="text" spellcheck="false" @update:modelValue="$refs.users.reload()">
				<template #prefix>@</template>
				<template #label>{{ $ts.username }}</template>
			</MkInput>
			<MkInput v-model="searchHost" style="flex: 1;" type="text" spellcheck="false" :disabled="pagination.params.origin === 'local'" @update:modelValue="$refs.users.reload()">
				<template #prefix>@</template>
				<template #label>{{ $ts.host }}</template>
			</MkInput>
		</div>

		<MkPagination v-slot="{items}" ref="paginationComponent" :pagination="pagination" class="users">
			<button v-for="user in items" :key="user.id" class="user _panel _button _gap" @click="show(user)">
				<MkAvatar class="avatar" :user="user" :disable-link="true" :show-indicator="true"/>
				<div class="body">
					<header>
						<MkUserName class="name" :user="user"/>
						<span class="acct">@{{ acct(user) }}</span>
						<span v-if="user.isAdmin" class="staff"><i class="fas fa-bookmark"></i></span>
						<span v-if="user.isModerator" class="staff"><i class="far fa-bookmark"></i></span>
						<span v-if="user.isSilenced" class="punished"><i class="fas fa-microphone-slash"></i></span>
						<span v-if="user.isSuspended" class="punished"><i class="fas fa-snowflake"></i></span>
					</header>
					<div>
						<span>{{ $ts.lastUsed }}: <MkTime v-if="user.updatedAt" :time="user.updatedAt" mode="detail"/></span>
					</div>
					<div>
						<span>{{ $ts.registeredDate }}: <MkTime :time="user.createdAt" mode="detail"/></span>
					</div>
				</div>
			</button>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkInput from '@/components/form/input.vue';
import MkSelect from '@/components/form/select.vue';
import MkPagination from '@/components/ui/pagination.vue';
import { acct } from '@/filters/user';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { lookupUser } from '@/scripts/lookup-user';
import { i18n } from '@/i18n';

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
	offsetMode: true
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
		type: 'password'
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

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: i18n.ts.users,
		icon: 'fas fa-users',
		bg: 'var(--bg)',
		actions: [{
			icon: 'fas fa-search',
			text: i18n.ts.search,
			handler: searchUser
		}, {
			asFullButton: true,
			icon: 'fas fa-plus',
			text: i18n.ts.addUser,
			handler: addUser
		}, {
			asFullButton: true,
			icon: 'fas fa-search',
			text: i18n.ts.lookup,
			handler: lookupUser
		}],
	})),
});
</script>

<style lang="scss" scoped>
.lknzcolw {
	> .users {
		margin: var(--margin);

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

			> .user {
				display: flex;
				width: 100%;
				box-sizing: border-box;
				text-align: left;
				align-items: center;
				padding: 16px;

				&:hover {
					color: var(--accent);
				}

				> .avatar {
					width: 60px;
					height: 60px;
				}

				> .body {
					margin-left: 0.3em;
					padding: 0 8px;
					flex: 1;

					@media (max-width: 500px) {
						font-size: 14px;
					}

					> header {
						> .name {
							font-weight: bold;
						}

						> .acct {
							margin-left: 8px;
							opacity: 0.7;
						}

						> .staff {
							margin-left: 0.5em;
							color: var(--badge);
						}

						> .punished {
							margin-left: 0.5em;
							color: #4dabf7;
						}
					}
				}
			}
		}
	}
}
</style>

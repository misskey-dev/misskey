<template>
<XModalWindow ref="dialogEl"
	:with-ok-button="true"
	:ok-button-disabled="selected == null"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="$emit('closed')"
>
	<template #header>{{ $ts.selectUser }}</template>
	<div class="tbhwbxda">
		<div class="form">
			<FormSplit :min-width="170">
				<MkInput ref="usernameEl" v-model="username" @update:modelValue="search">
					<template #label>{{ $ts.username }}</template>
					<template #prefix>@</template>
				</MkInput>
				<MkInput v-model="host" @update:modelValue="search">
					<template #label>{{ $ts.host }}</template>
					<template #prefix>@</template>
				</MkInput>
			</FormSplit>
		</div>
		<div v-if="username != '' || host != ''" class="result" :class="{ hit: users.length > 0 }">
			<div v-if="users.length > 0" class="users">
				<div v-for="user in users" :key="user.id" class="user" :class="{ selected: selected && selected.id === user.id }" @click="selected = user" @dblclick="ok()">
					<MkAvatar :user="user" class="avatar" :show-indicator="true"/>
					<div class="body">
						<MkUserName :user="user" class="name"/>
						<MkAcct :user="user" class="acct"/>
					</div>
				</div>
			</div>
			<div v-else class="empty">
				<span>{{ $ts.noUsers }}</span>
			</div>
		</div>
		<div v-if="username == '' && host == ''" class="recent">
			<div class="users">
				<div v-for="user in recentUsers" :key="user.id" class="user" :class="{ selected: selected && selected.id === user.id }" @click="selected = user" @dblclick="ok()">
					<MkAvatar :user="user" class="avatar" :show-indicator="true"/>
					<div class="body">
						<MkUserName :user="user" class="name"/>
						<MkAcct :user="user" class="acct"/>
					</div>
				</div>
			</div>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts" setup>
import { nextTick, onMounted } from 'vue';
import * as misskey from 'misskey-js';
import MkInput from '@/components/form/input.vue';
import FormSplit from '@/components/form/split.vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';

const emit = defineEmits<{
	(ev: 'ok', selected: misskey.entities.UserDetailed): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

let username = $ref('');
let host = $ref('');
let users: misskey.entities.UserDetailed[] = $ref([]);
let recentUsers: misskey.entities.UserDetailed[] = $ref([]);
let selected: misskey.entities.UserDetailed | null = $ref(null);
let usernameEl: HTMLElement = $ref();
let dialogEl = $ref();

const focus = () => {
	if (usernameEl) {
		usernameEl.focus();
	}
};

const search = () => {
	if (username === '' && host === '') {
		users = [];
		return;
	}
	os.api('users/search-by-username-and-host', {
		username: username,
		host: host,
		limit: 10,
		detail: false
	}).then(_users => {
		users = _users;
	});
};

const ok = () => {
	if (selected == null) return;
	emit('ok', selected);
	dialogEl.close();

	// 最近使ったユーザー更新
	let recents = defaultStore.state.recentlyUsedUsers;
	recents = recents.filter(x => x !== selected.id);
	recents.unshift(selected.id);
	defaultStore.set('recentlyUsedUsers', recents.splice(0, 16));
};

const cancel = () => {
	emit('cancel');
	dialogEl.close();
};

onMounted(() => {
	focus();

	nextTick(() => {
		focus();
	});

	os.api('users/show', {
		userIds: defaultStore.state.recentlyUsedUsers,
	}).then(users => {
		recentUsers = users;
	});
});
</script>

<style lang="scss" scoped>
.tbhwbxda {
	> .form {
		padding: 0 var(--root-margin);
	}

	> .result, > .recent {
		display: flex;
		flex-direction: column;
		overflow: auto;
		height: 100%;

		&.result.hit {
			padding: 0;
		}

		&.recent {
			padding: 0;
		}

		> .users {
			flex: 1;
			overflow: auto;
			padding: 8px 0;

			> .user {
				display: flex;
				align-items: center;
				padding: 8px var(--root-margin);
				font-size: 14px;

				&:hover {
					background: var(--X7);
				}

				&.selected {
					background: var(--accent);
					color: #fff;
				}

				> * {
					pointer-events: none;
					user-select: none;
				}

				> .avatar {
					width: 45px;
					height: 45px;
				}

				> .body {
					padding: 0 8px;
					min-width: 0;

					> .name {
						display: block;
						font-weight: bold;
					}

					> .acct {
						opacity: 0.5;
					}
				}
			}
		}

		> .empty {
			opacity: 0.7;
			text-align: center;
		}
	}
}
</style>

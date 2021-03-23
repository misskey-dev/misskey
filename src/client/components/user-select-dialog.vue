<template>
<XModalWindow ref="dialog"
	:with-ok-button="true"
	:ok-button-disabled="selected == null"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="$emit('closed')"
>
	<template #header>{{ $ts.selectUser }}</template>
	<div class="tbhwbxda _section">
		<div class="inputs">
			<MkInput v-model:value="username" class="input" @update:value="search" ref="username"><span>{{ $ts.username }}</span><template #prefix>@</template></MkInput>
			<MkInput v-model:value="host" class="input" @update:value="search"><span>{{ $ts.host }}</span><template #prefix>@</template></MkInput>
		</div>
	</div>
	<div class="tbhwbxda _section result" v-if="username != '' || host != ''" :class="{ hit: users.length > 0 }">
		<div class="users" v-if="users.length > 0">
			<div class="user" v-for="user in users" :key="user.id" :class="{ selected: selected && selected.id === user.id }" @click="selected = user" @dblclick="ok()">
				<MkAvatar :user="user" class="avatar"/>
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
	<div class="tbhwbxda _section recent" v-if="username == '' && host == ''">
		<div class="users">
			<div class="user" v-for="user in recentUsers" :key="user.id" :class="{ selected: selected && selected.id === user.id }" @click="selected = user" @dblclick="ok()">
				<MkAvatar :user="user" class="avatar"/>
				<div class="body">
					<MkUserName :user="user" class="name"/>
					<MkAcct :user="user" class="acct"/>
				</div>
			</div>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import MkInput from './ui/input.vue';
import XModalWindow from '@client/components/ui/modal-window.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkInput,
		XModalWindow,
	},

	props: {
	},

	emits: ['ok', 'cancel', 'closed'],

	data() {
		return {
			username: '',
			host: '',
			recentUsers: [],
			users: [],
			selected: null,
			faTimes, faCheck
		};
	},

	async mounted() {
		this.focus();

		this.$nextTick(() => {
			this.focus();
		});

		this.recentUsers = await os.api('users/show', {
			userIds: this.$store.state.recentlyUsedUsers
		});
	},

	methods: {
		search() {
			if (this.username == '' && this.host == '') {
				this.users = [];
				return;
			}
			os.api('users/search-by-username-and-host', {
				username: this.username,
				host: this.host,
				limit: 10,
				detail: false
			}).then(users => {
				this.users = users;
			});
		},

		focus() {
			this.$refs.username.focus();
		},

		ok() {
			this.$emit('ok', this.selected);
			this.$refs.dialog.close();

			// 最近使ったユーザー更新
			let recents = this.$store.state.recentlyUsedUsers;
			recents = recents.filter(x => x !== this.selected.id);
			recents.unshift(this.selected.id);
			this.$store.set('recentlyUsedUsers', recents.splice(0, 16));
		},

		cancel() {
			this.$emit('cancel');
			this.$refs.dialog.close();
		},
	}
});
</script>

<style lang="scss" scoped>
.tbhwbxda {
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

	> .inputs {
		> .input {
			display: inline-block;
			width: 50%;
			margin: 0;
		}
	}

	> .users {
		flex: 1;
		overflow: auto;
		padding: 8px 0;

		> .user {
			display: flex;
			align-items: center;
			padding: 8px var(--section-padding);
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
</style>

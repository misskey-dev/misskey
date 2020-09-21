<template>
<x-window @close="$emit('done')" :with-ok-button="true" :ok-button-disabled="selected == null" @ok="ok()">
	<template #header>{{ $t('selectUser') }}</template>
	<div class="tbhwbxda">
		<div class="inputs">
			<mk-input v-model:value="username" class="input" @update:value="search" ref="username"><span>{{ $t('username') }}</span><template #prefix>@</template></mk-input>
			<mk-input v-model:value="host" class="input" @update:value="search"><span>{{ $t('host') }}</span><template #prefix>@</template></mk-input>
		</div>
		<div class="users">
			<div class="user" v-for="user in users" :key="user.id" :class="{ selected: selected && selected.id === user.id }" @click="selected = user" @dblclick="ok()">
				<mk-avatar :user="user" class="avatar" :disable-link="true"/>
				<div class="body">
					<mk-user-name :user="user" class="name"/>
					<mk-acct :user="user" class="acct"/>
				</div>
			</div>
		</div>
	</div>
</x-window>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import MkInput from './ui/input.vue';
import XWindow from './window.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkInput,
		XWindow,
	},

	props: {
	},

	emits: ['done'],

	data() {
		return {
			username: '',
			host: '',
			users: [],
			selected: null,
			faTimes, faCheck
		};
	},

	mounted() {
		this.focus();

		this.$nextTick(() => {
			this.focus();
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
			this.$emit('done', this.selected);
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
		
	> .inputs {
		margin-top: 16px;

		> .input {
			display: inline-block;
			width: 50%;
			margin: 0;
		}
	}

	> .users {
		flex: 1;
		overflow: auto;

		> .user {
			display: flex;
			align-items: center;
			padding: 8px 16px;
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
}
</style>

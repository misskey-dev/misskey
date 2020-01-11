<template>
<x-modal ref="modal" @closed="() => { $emit('closed'); destroyDom(); }">
	<div class="mk-user-select">
		<div class="header">
			<button class="_button" @click="close()"><fa :icon="faTimes"/></button>
			<span>{{ $t('selectUser') }}</span>
			<button class="_button" :disabled="selected == null" @click="ok()"><fa :icon="faCheck"/></button>
		</div>
		<div class="inputs">
			<x-input v-model="username" class="input" @input="search" ref="username"><span>{{ $t('username') }}</span><template #prefix>@</template></x-input>
			<x-input v-model="host" class="input" @input="search"><span>{{ $t('host') }}</span><template #prefix>@</template></x-input>
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
</x-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import XInput from './ui/input.vue';
import XModal from './modal.vue';

export default Vue.extend({
	i18n,

	components: {
		XInput,
		XModal,
	},

	props: {
	},

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
			this.$root.api('users/search', {
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

		close() {
			this.$refs.modal.close();
		},

		ok() {
			this.$emit('selected', this.selected);
			this.close();
		},
	}
});
</script>

<style lang="scss" scoped>
@import '../theme';

.mk-user-select {
	width: 350px;
	height: 350px;
	background: var(--bg);
	border-radius: var(--radius);
	overflow: hidden;
	display: flex;
	flex-direction: column;

	> .header {
		display: flex;
		flex-shrink: 0;

		> button {
			height: 42px;
			width: 42px;
		}

		> span {
			flex: 1;
			line-height: 42px;
		}
	}

	> .inputs {
		padding: 8px 16px 16px 16px;

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
				background: rgba(0, 0, 0, 0.05);

				@media (prefers-color-scheme: dark) {
					background: rgba(255, 255, 255, 0.05);
				}
			}

			&:active {
				background: rgba(0, 0, 0, 0.1);

				@media (prefers-color-scheme: dark) {
					background: rgba(255, 255, 255, 0.1);
				}
			}

			&.selected {
				background: $primary;
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

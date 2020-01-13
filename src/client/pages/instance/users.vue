<template>
<section class="_section mk-instance-users">
	<div class="title"><fa :icon="faUsers"/> {{ $t('users') }}</div>
	<div class="content padHalf">
		<x-pagination :pagination="pagination" #default="{items}" class="users" ref="users" :auto-margin="false">
			<button class="user _button" v-for="(user, i) in items" :key="user.id" :data-index="i" @click="show(user)">
				<mk-avatar :user="user" class="avatar"/>
				<div class="body">
					<mk-user-name :user="user" class="name"/>
					<mk-acct :user="user" class="acct"/>
				</div>
			</button>
		</x-pagination>
	</div>
	<div class="footer">
		<x-button inline primary @click="addUser()"><fa :icon="faPlus"/> {{ $t('addUser') }}</x-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import XButton from '../../components/ui/button.vue';
import XPagination from '../../components/ui/pagination.vue';
import MkUserModerateDialog from '../../components/user-moderate-dialog.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: `${this.$t('users')} | ${this.$t('instance')}`
		};
	},

	components: {
		XButton,
		XPagination,
	},

	data() {
		return {
			pagination: {
				endpoint: 'admin/show-users',
				limit: 10,
				offsetMode: true
			},
			faPlus, faUsers
		}
	},

	methods: {
		async addUser() {
			const { canceled: canceled1, result: username } = await this.$root.dialog({
				title: this.$t('username'),
				input: true
			});
			if (canceled1) return;

			const { canceled: canceled2, result: password } = await this.$root.dialog({
				title: this.$t('password'),
				input: { type: 'password' }
			});
			if (canceled2) return;

			const dialog = this.$root.dialog({
				type: 'waiting',
				iconOnly: true
			});

			this.$root.api('admin/accounts/create', {
				username: username,
				password: password,
			}).then(res => {
				this.$refs.users.reload();
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.id
				});
			}).finally(() => {
				dialog.close();
			});
		},

		show(user) {
			this.$root.new(MkUserModerateDialog, {
				user
			});
		}
	}
});
</script>

<style lang="scss" scoped>
@import '../../theme';

.mk-instance-users {
	> .content {
		max-height: 300px;
		overflow: auto;
		
		> .users {
			> .user {
				display: flex;
				width: 100%;
				box-sizing: border-box;
				text-align: left;
				align-items: center;
				padding: 8px 16px;
				border-radius: var(--radius);

				@media (max-width: 500px) {
					padding: 8px;
				}

				&:hover {
					background: rgba(0, 0, 0, 0.03);

					@media (prefers-color-scheme: dark) {
						background: rgba(255, 255, 255, 0.03);
					}
				}

				> * {
					pointer-events: none;
				}

				> .avatar {
					width: 50px;
					height: 50px;
				}

				> .body {
					padding: 8px;

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
}
</style>

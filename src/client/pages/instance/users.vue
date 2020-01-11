<template>
<section class="_section mk-instance-users">
	<div class="title"><fa :icon="faUsers"/> {{ $t('users') }}</div>
	<div class="content">
		<x-pagination :pagination="pagination" #default="{items}" class="users" ref="users">
			<div class="user" v-for="(user, i) in items" :key="user.id" :data-index="i" @click="selected = user" :class="{ selected: selected && (selected.id === user.id) }">
				<mk-avatar :user="user" class="avatar"/>
				<div class="body">
					<mk-user-name :user="user" class="name"/>
					<mk-acct :user="user" class="acct"/>
				</div>
			</div>
		</x-pagination>
	</div>
	<div class="footer">
		<x-button inline primary @click="addUser()"><fa :icon="faPlus"/> {{ $t('addUser') }}</x-button>
		<x-button inline :disabled="selected == null" @click="changePassword()">{{ $t('changePassword') }}</x-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import XButton from '../../components/ui/button.vue';
import XPagination from '../../components/ui/pagination.vue';

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
			selected: null,
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

		async changePassword() {
			const { canceled: canceled, result: newPassword } = await this.$root.dialog({
				title: this.$t('newPassword'),
				input: {
					type: 'password'
				}
			});
			if (canceled) return;

			const dialog = this.$root.dialog({
				type: 'waiting',
				iconOnly: true
			});
			
			this.$root.api('admin/change-password', {
				userId: this.selected.id,
				newPassword
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			}).finally(() => {
				dialog.close();
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
				align-items: center;

				&.selected {
					background: $primary;
					box-shadow: 0 0 0 8px $primary;
					color: #fff;
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

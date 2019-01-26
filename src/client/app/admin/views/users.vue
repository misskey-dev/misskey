<template>
<div>
	<ui-card>
		<div slot="title"><fa :icon="faTerminal"/> {{ $t('operation') }}</div>
		<section class="fit-top">
			<ui-input v-model="target" type="text" @change="showUser">
				<span>{{ $t('username-or-userid') }}</span>
			</ui-input>

			<ui-button @click="showUser"><fa :icon="faSearch"/> {{ $t('lookup') }}</ui-button>

			<div v-if="user">
				<x-user :user='user'/>
				<ui-button @click="resetPassword"><fa :icon="faKey"/> {{ $t('reset-password') }}</ui-button>
				<ui-horizon-group>
					<ui-button @click="verifyUser" :disabled="verifying"><fa :icon="faCertificate"/> {{ $t('verify') }}</ui-button>
					<ui-button @click="unverifyUser" :disabled="unverifying">{{ $t('unverify') }}</ui-button>
				</ui-horizon-group>
				<ui-horizon-group>
					<ui-button @click="suspendUser" :disabled="suspending"><fa :icon="faSnowflake"/> {{ $t('suspend') }}</ui-button>
					<ui-button @click="unsuspendUser" :disabled="unsuspending">{{ $t('unsuspend') }}</ui-button>
				</ui-horizon-group>
				<ui-textarea v-if="user" :value="user | json5" readonly tall style="margin-top:16px;"></ui-textarea>
			</div>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title"><fa :icon="faUsers"/> {{ $t('users.title') }}</div>
		<section class="fit-top">
			<ui-horizon-group inputs>
				<ui-select v-model="sort">
					<span slot="label">{{ $t('users.sort.title') }}</span>
					<option value="-createdAt">{{ $t('users.sort.createdAtAsc') }}</option>
					<option value="+createdAt">{{ $t('users.sort.createdAtDesc') }}</option>
					<option value="-updatedAt">{{ $t('users.sort.updatedAtAsc') }}</option>
					<option value="+updatedAt">{{ $t('users.sort.updatedAtDesc') }}</option>
				</ui-select>
				<ui-select v-model="state">
					<span slot="label">{{ $t('users.state.title') }}</span>
					<option value="all">{{ $t('users.state.all') }}</option>
					<option value="admin">{{ $t('users.state.admin') }}</option>
					<option value="moderator">{{ $t('users.state.moderator') }}</option>
					<option value="verified">{{ $t('users.state.verified') }}</option>
					<option value="suspended">{{ $t('users.state.suspended') }}</option>
				</ui-select>
				<ui-select v-model="origin">
					<span slot="label">{{ $t('users.origin.title') }}</span>
					<option value="combined">{{ $t('users.origin.combined') }}</option>
					<option value="local">{{ $t('users.origin.local') }}</option>
					<option value="remote">{{ $t('users.origin.remote') }}</option>
				</ui-select>
			</ui-horizon-group>
			<sequential-entrance animation="entranceFromTop" delay="25">
				<x-user v-for="user in users" :user='user' :key="user.id"/>
			</sequential-entrance>
			<ui-button v-if="existMore" @click="fetchUsers">{{ $t('@.load-more') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import parseAcct from "../../../../misc/acct/parse";
import { faCertificate, faUsers, faTerminal, faSearch, faKey } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake } from '@fortawesome/free-regular-svg-icons';
import XUser from './users.user.vue';

export default Vue.extend({
	i18n: i18n('admin/views/users.vue'),
	components: {
		XUser
	},
	data() {
		return {
			user: null,
			target: null,
			verifying: false,
			unverifying: false,
			suspending: false,
			unsuspending: false,
			sort: '+createdAt',
			state: 'all',
			origin: 'combined',
			limit: 10,
			offset: 0,
			users: [],
			existMore: false,
			faTerminal, faCertificate, faUsers, faSnowflake, faSearch, faKey
		};
	},

	watch: {
		sort() {
			this.users = [];
			this.offset = 0;
			this.fetchUsers();
		},

		state() {
			this.users = [];
			this.offset = 0;
			this.fetchUsers();
		},

		origin() {
			this.users = [];
			this.offset = 0;
			this.fetchUsers();
		}
	},

	mounted() {
		this.fetchUsers();
	},

	methods: {
		async fetchUser() {
			try {
				return await this.$root.api('users/show', this.target.startsWith('@') ? parseAcct(this.target) : { userId: this.target });
			} catch (e) {
				if (e == 'user not found') {
					this.$root.dialog({
						type: 'error',
						text: this.$t('user-not-found')
					});
				} else {
					this.$root.dialog({
						type: 'error',
						text: e.toString()
					});
				}
			}
		},

		async showUser() {
			this.user = null;
			const user = await this.fetchUser();
			this.$root.api('admin/show-user', { userId: user.id }).then(info => {
				this.user = info;
			});
			this.target = '';
		},

		async resetPassword() {
			if (!await this.getConfirmed(this.$t('reset-confirm'))) return;

			this.$root.api('admin/reset-password', { userId: this.user._id }).then(res => {
				this.$root.dialog({
					type: 'success',
					text: this.$t('password-updated', { password: res.password })
				});
			});
		},

		async verifyUser() {
			if (!await this.getConfirmed(this.$t('verify-confirm'))) return;

			this.verifying = true;

			const process = async () => {
				await this.$root.api('admin/verify-user', { userId: this.user._id });
				this.$root.dialog({
					type: 'success',
					text: this.$t('verified')
				});
			};

			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});

			this.verifying = false;
			this.showUser();
		},

		async unverifyUser() {
			if (!await this.getConfirmed(this.$t('unverify-confirm'))) return;

			this.unverifying = true;

			const process = async () => {
				await this.$root.api('admin/unverify-user', { userId: this.user._id });
				this.$root.dialog({
					type: 'success',
					text: this.$t('unverified')
				});
			};

			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});

			this.unverifying = false;
			this.showUser();
		},

		async suspendUser() {
			if (!await this.getConfirmed(this.$t('suspend-confirm'))) return;

			this.suspending = true;

			const process = async () => {
				await this.$root.api('admin/suspend-user', { userId: this.user._id });
				this.$root.dialog({
					type: 'success',
					text: this.$t('suspended')
				});
			};

			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});

			this.suspending = false;
			this.showUser();
		},

		async unsuspendUser() {
			if (!await this.getConfirmed(this.$t('unsuspend-confirm'))) return;

			this.unsuspending = true;

			const process = async () => {
				await this.$root.api('admin/unsuspend-user', { userId: this.user._id });
				this.$root.dialog({
					type: 'success',
					text: this.$t('unsuspended')
				});
			};

			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});

			this.unsuspending = false;
			this.showUser();
		},

		async getConfirmed(text: string): Promise<Boolean> {
			const confirm = await this.$root.dialog({
				type: 'warning',
				showCancelButton: true,
				text,
			});

			return !confirm.canceled;
		}

		fetchUsers() {
			this.$root.api('admin/show-users', {
				state: this.state,
				origin: this.origin,
				sort: this.sort,
				offset: this.offset,
				limit: this.limit + 1
			}).then(users => {
				if (users.length == this.limit + 1) {
					users.pop();
					this.existMore = true;
				} else {
					this.existMore = false;
				}
				this.users = this.users.concat(users);
				this.offset += this.limit;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.kofvwchc
	display flex
	padding 16px 0
	border-top solid 1px var(--faceDivider)

	> div:first-child
		> a
			> .avatar
				width 64px
				height 64px

	> div:last-child
		flex 1
		padding-left 16px

		@media (max-width 500px)
			font-size 14px

		> header
			> .username
				margin-left 8px
				opacity 0.7

			> .is-admin
			> .is-moderator
				flex-shrink 0
				align-self center
				margin 0 0 0 .5em
				padding 1px 6px
				font-size 80%
				border-radius 3px
				background var(--noteHeaderAdminBg)
				color var(--noteHeaderAdminFg)

			> .is-verified
			> .is-suspended
				margin 0 0 0 .5em
				color #4dabf7
</style>

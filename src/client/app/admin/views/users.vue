<template>
<div class="ucnffhbtogqgscfmqcymwmmupoknpfsw">
	<ui-card>
		<div slot="title"><fa :icon="faTerminal"/> {{ $t('operation') }}</div>
		<section class="fit-top">
			<ui-input v-model="target" type="text">
				<span>{{ $t('username-or-userid') }}</span>
			</ui-input>
			<ui-button @click="resetPassword"><fa :icon="faKey"/> {{ $t('reset-password') }}</ui-button>
			<ui-horizon-group>
				<ui-button @click="verifyUser" :disabled="verifying"><fa :icon="faCertificate"/> {{ $t('verify') }}</ui-button>
				<ui-button @click="unverifyUser" :disabled="unverifying">{{ $t('unverify') }}</ui-button>
			</ui-horizon-group>
			<ui-horizon-group>
				<ui-button @click="suspendUser" :disabled="suspending"><fa :icon="faSnowflake"/> {{ $t('suspend') }}</ui-button>
				<ui-button @click="unsuspendUser" :disabled="unsuspending">{{ $t('unsuspend') }}</ui-button>
			</ui-horizon-group>
			<ui-button @click="showUser"><fa :icon="faSearch"/> {{ $t('lookup') }}</ui-button>
			<ui-textarea v-if="user" :value="user | json5" readonly tall style="margin-top:16px;"></ui-textarea>
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
				<ui-select v-model="origin">
					<span slot="label">{{ $t('users.origin.title') }}</span>
					<option value="combined">{{ $t('users.origin.combined') }}</option>
					<option value="local">{{ $t('users.origin.local') }}</option>
					<option value="remote">{{ $t('users.origin.remote') }}</option>
				</ui-select>
			</ui-horizon-group>
			<div class="kofvwchc" v-for="user in users">
				<div>
					<a :href="user | userPage(null, true)">
						<mk-avatar class="avatar" :user="user" :disable-link="true"/>
					</a>
				</div>
				<div>
					<header>
						<b>{{ user | userName }}</b>
						<span class="username">@{{ user | acct }}</span>
					</header>
					<div>
						<span>{{ $t('users.createdAt') }}: <mk-time :time="user.createdAt" mode="detail"/></span>
					</div>
					<div>
						<span>{{ $t('users.updatedAt') }}: <mk-time :time="user.updatedAt" mode="detail"/></span>
					</div>
				</div>
			</div>
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

export default Vue.extend({
	i18n: i18n('admin/views/users.vue'),

	data() {
		return {
			user: null,
			target: null,
			verifying: false,
			unverifying: false,
			suspending: false,
			unsuspending: false,
			sort: '+createdAt',
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
					this.$root.alert({
						type: 'error',
						text: this.$t('user-not-found')
					});
				} else {
					this.$root.alert({
						type: 'error',
						text: e.toString()
					});
				}
			}
		},

		async showUser() {
			const user = await this.fetchUser();
			this.$root.api('admin/show-user', { userId: user.id }).then(info => {
				this.user = info;
			});
		},

		async resetPassword() {
			const user = await this.fetchUser();
			this.$root.api('admin/reset-password', { userId: user.id }).then(res => {
				this.$root.alert({
					type: 'success',
					text: this.$t('password-updated', { password: res.password })
				});
			});
		},

		async verifyUser() {
			this.verifying = true;

			const process = async () => {
				const user = await this.fetchUser();
				await this.$root.api('admin/verify-user', { userId: user.id });
				this.$root.alert({
					type: 'success',
					text: this.$t('verified')
				});
			};

			await process().catch(e => {
				this.$root.alert({
					type: 'error',
					text: e.toString()
				});
			});

			this.verifying = false;
		},

		async unverifyUser() {
			this.unverifying = true;

			const process = async () => {
				const user = await this.fetchUser();
				await this.$root.api('admin/unverify-user', { userId: user.id });
				this.$root.alert({
					type: 'success',
					text: this.$t('unverified')
				});
			};

			await process().catch(e => {
				this.$root.alert({
					type: 'error',
					text: e.toString()
				});
			});

			this.unverifying = false;
		},

		async suspendUser() {
			this.suspending = true;

			const process = async () => {
				const user = await this.fetchUser();
				await this.$root.api('admin/suspend-user', { userId: user.id });
				this.$root.alert({
					type: 'success',
					text: this.$t('suspended')
				});
			};

			await process().catch(e => {
				this.$root.alert({
					type: 'error',
					text: e.toString()
				});
			});

			this.suspending = false;
		},

		async unsuspendUser() {
			this.unsuspending = true;

			const process = async () => {
				const user = await this.fetchUser();
				await this.$root.api('admin/unsuspend-user', { userId: user.id });
				this.$root.alert({
					type: 'success',
					text: this.$t('unsuspended')
				});
			};

			await process().catch(e => {
				this.$root.alert({
					type: 'error',
					text: e.toString()
				});
			});

			this.unsuspending = false;
		},

		fetchUsers() {
			this.$root.api('users', {
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
.ucnffhbtogqgscfmqcymwmmupoknpfsw
	@media (min-width 500px)
		padding 16px

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

			> header
				> .username
					margin-left 8px
					opacity 0.7

</style>

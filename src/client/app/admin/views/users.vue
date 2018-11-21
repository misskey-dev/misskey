<template>
<div class="ucnffhbtogqgscfmqcymwmmupoknpfsw">
	<ui-card>
		<div slot="title"><fa :icon="faCertificate"/> {{ $t('verify-user') }}</div>
		<section class="fit-top">
			<ui-input v-model="verifyUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-horizon-group>
				<ui-button @click="verifyUser" :disabled="verifying">{{ $t('verify') }}</ui-button>
				<ui-button @click="unverifyUser" :disabled="unverifying">{{ $t('unverify') }}</ui-button>
			</ui-horizon-group>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title"><fa :icon="faSnowflake"/> {{ $t('suspend-user') }}</div>
		<section class="fit-top">
			<ui-input v-model="suspendUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-horizon-group>
				<ui-button @click="suspendUser" :disabled="suspending">{{ $t('suspend') }}</ui-button>
				<ui-button @click="unsuspendUser" :disabled="unsuspending">{{ $t('unsuspend') }}</ui-button>
			</ui-horizon-group>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import parseAcct from "../../../../misc/acct/parse";
import { faCertificate } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/users.vue'),

	data() {
		return {
			verifyUsername: null,
			verifying: false,
			unverifying: false,
			suspendUsername: null,
			suspending: false,
			unsuspending: false,
			faCertificate, faSnowflake
		};
	},

	methods: {
		async verifyUser() {
			this.verifying = true;

			const process = async () => {
				const user = await this.$root.api('users/show', parseAcct(this.verifyUsername));
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
				const user = await this.$root.api('users/show', parseAcct(this.verifyUsername));
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
				const user = await this.$root.api('users/show', parseAcct(this.suspendUsername));
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
				const user = await this.$root.api('users/show', parseAcct(this.suspendUsername));
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
		}
	}
});
</script>

<style lang="stylus" scoped>
.ucnffhbtogqgscfmqcymwmmupoknpfsw
	@media (min-width 500px)
		padding 16px

</style>

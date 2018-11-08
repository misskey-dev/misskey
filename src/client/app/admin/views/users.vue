<template>
<div class="ucnffhbtogqgscfmqcymwmmupoknpfsw">
	<ui-card>
		<div slot="title">{{ $t('verify-user') }}</div>
		<section class="fit-top">
			<ui-input v-model="verifyUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-button @click="verifyUser" :disabled="verifying">{{ $t('verify') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">{{ $t('unverify-user') }}</div>
		<section class="fit-top">
			<ui-input v-model="unverifyUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-button @click="unverifyUser" :disabled="unverifying">{{ $t('unverify') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">{{ $t('suspend-user') }}</div>
		<section class="fit-top">
			<ui-input v-model="suspendUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-button @click="suspendUser" :disabled="suspending">{{ $t('suspend') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">{{ $t('unsuspend-user') }}</div>
		<section class="fit-top">
			<ui-input v-model="unsuspendUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-button @click="unsuspendUser" :disabled="unsuspending">{{ $t('unsuspend') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import parseAcct from "../../../../misc/acct/parse";

export default Vue.extend({
	i18n: i18n('admin/views/users.vue'),
	data() {
		return {
			verifyUsername: null,
			verifying: false,
			unverifyUsername: null,
			unverifying: false,
			suspendUsername: null,
			suspending: false,
			unsuspendUsername: null,
			unsuspending: false
		};
	},

	methods: {
		async verifyUser() {
			this.verifying = true;

			const process = async () => {
				const user = await this.$root.os.api('users/show', parseAcct(this.verifyUsername));
				await this.$root.os.api('admin/verify-user', { userId: user.id });
				//this.$root.os.apis.dialog({ text: this.$t('verified') });
			};

			await process().catch(e => {
				//this.$root.os.apis.dialog({ text: `Failed: ${e}` });
			});

			this.verifying = false;
		},

		async unverifyUser() {
			this.unverifying = true;

			const process = async () => {
				const user = await this.$root.os.api('users/show', parseAcct(this.unverifyUsername));
				await this.$root.os.api('admin/unverify-user', { userId: user.id });
				//this.$root.os.apis.dialog({ text: this.$t('unverified') });
			};

			await process().catch(e => {
				//this.$root.os.apis.dialog({ text: `Failed: ${e}` });
			});

			this.unverifying = false;
		},

		async suspendUser() {
			this.suspending = true;

			const process = async () => {
				const user = await this.$root.os.api('users/show', parseAcct(this.suspendUsername));
				await this.$root.os.api('admin/suspend-user', { userId: user.id });
				//this.$root.os.apis.dialog({ text: this.$t('suspended') });
			};

			await process().catch(e => {
				//this.$root.os.apis.dialog({ text: `Failed: ${e}` });
			});

			this.suspending = false;
		},

		async unsuspendUser() {
			this.unsuspending = true;

			const process = async () => {
				const user = await this.$root.os.api('users/show', parseAcct(this.unsuspendUsername));
				await this.$root.os.api('admin/unsuspend-user', { userId: user.id });
				//this.$root.os.apis.dialog({ text: this.$t('unsuspended') });
			};

			await process().catch(e => {
				//this.$root.os.apis.dialog({ text: `Failed: ${e}` });
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

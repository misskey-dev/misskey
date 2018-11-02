<template>
<div>
	<ui-card>
		<div slot="title">%i18n:@verify-user%</div>
		<section class="fit-top">
			<ui-input v-model="verifyUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-button @click="verifyUser" :disabled="verifying">%i18n:@verify%</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">%i18n:@unverify-user%</div>
		<section class="fit-top">
			<ui-input v-model="unverifyUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-button @click="unverifyUser" :disabled="unverifying">%i18n:@unverify%</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">%i18n:@suspend-user%</div>
		<section class="fit-top">
			<ui-input v-model="suspendUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-button @click="suspendUser" :disabled="suspending">%i18n:@suspend%</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">%i18n:@unsuspend-user%</div>
		<section class="fit-top">
			<ui-input v-model="unsuspendUsername" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-button @click="unsuspendUser" :disabled="unsuspending">%i18n:@unsuspend%</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import parseAcct from "../../../../misc/acct/parse";

export default Vue.extend({
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
				const user = await (this as any).os.api('users/show', parseAcct(this.verifyUsername));
				await (this as any).os.api('admin/verify-user', { userId: user.id });
				(this as any).os.apis.dialog({ text: '%i18n:@verified%' });
			};

			await process().catch(e => {
				(this as any).os.apis.dialog({ text: `Failed: ${e}` });
			});

			this.verifying = false;
		},

		async unverifyUser() {
			this.unverifying = true;

			const process = async () => {
				const user = await (this as any).os.api('users/show', parseAcct(this.unverifyUsername));
				await (this as any).os.api('admin/unverify-user', { userId: user.id });
				(this as any).os.apis.dialog({ text: '%i18n:@unverified%' });
			};

			await process().catch(e => {
				(this as any).os.apis.dialog({ text: `Failed: ${e}` });
			});

			this.unverifying = false;
		},

		async suspendUser() {
			this.suspending = true;

			const process = async () => {
				const user = await (this as any).os.api('users/show', parseAcct(this.suspendUsername));
				await (this as any).os.api('admin/suspend-user', { userId: user.id });
				(this as any).os.apis.dialog({ text: '%i18n:@suspended%' });
			};

			await process().catch(e => {
				(this as any).os.apis.dialog({ text: `Failed: ${e}` });
			});

			this.suspending = false;
		},

		async unsuspendUser() {
			this.unsuspending = true;

			const process = async () => {
				const user = await (this as any).os.api('users/show', parseAcct(this.unsuspendUsername));
				await (this as any).os.api('admin/unsuspend-user', { userId: user.id });
				(this as any).os.apis.dialog({ text: '%i18n:@unsuspended%' });
			};

			await process().catch(e => {
				(this as any).os.apis.dialog({ text: `Failed: ${e}` });
			});

			this.unsuspending = false;
		}
	}
});
</script>

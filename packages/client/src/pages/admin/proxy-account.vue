<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<MkInfo class="_formBlock">{{ $ts.proxyAccountDescription }}</MkInfo>
		<MkKeyValue class="_formBlock">
			<template #key>{{ $ts.proxyAccount }}</template>
			<template #value>{{ proxyAccount ? `@${proxyAccount.username}` : $ts.none }}</template>
		</MkKeyValue>

		<FormButton primary class="_formBlock" @click="chooseProxyAccount">{{ $ts.selectAccount }}</FormButton>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkKeyValue from '@/components/key-value.vue';
import FormButton from '@/components/ui/button.vue';
import MkInfo from '@/components/ui/info.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		MkKeyValue,
		FormButton,
		MkInfo,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.proxyAccount,
				icon: 'fas fa-ghost',
				bg: 'var(--bg)',
			},
			proxyAccount: null,
			proxyAccountId: null,
		}
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.proxyAccountId = meta.proxyAccountId;
			if (this.proxyAccountId) {
				this.proxyAccount = await os.api('users/show', { userId: this.proxyAccountId });
			}
		},

		chooseProxyAccount() {
			os.selectUser().then(user => {
				this.proxyAccount = user;
				this.proxyAccountId = user.id;
				this.save();
			});
		},

		save() {
			os.apiWithDialog('admin/update-meta', {
				proxyAccountId: this.proxyAccountId,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>

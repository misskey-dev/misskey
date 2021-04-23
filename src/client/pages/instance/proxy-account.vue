<template>
<FormBase>
	<FormSuspense :p="init">
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.proxyAccount }}</template>
				<template #value>{{ proxyAccount ? `@${proxyAccount.username}` : $ts.none }}</template>
			</FormKeyValueView>
			<template #caption>{{ $ts.proxyAccountDescription }}</template>
		</FormGroup>

		<FormButton @click="chooseProxyAccount" primary>{{ $ts.selectAccount }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import FormInput from '@client/components/form/input.vue';
import FormButton from '@client/components/form/button.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormInfo from '@client/components/form/info.vue';
import FormSuspense from '@client/components/form/suspense.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { fetchInstance } from '@client/instance';

export default defineComponent({
	components: {
		FormKeyValueView,
		FormInput,
		FormBase,
		FormGroup,
		FormButton,
		FormTextarea,
		FormInfo,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.proxyAccount,
				icon: 'fas fa-ghost'
			},
			proxyAccount: null,
			proxyAccountId: null,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
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

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
import FormKeyValueView from '@/components/debobigego/key-value-view.vue';
import FormInput from '@/components/debobigego/input.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormTextarea from '@/components/debobigego/textarea.vue';
import FormInfo from '@/components/debobigego/info.vue';
import FormSuspense from '@/components/debobigego/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

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
				icon: 'fas fa-ghost',
				bg: 'var(--bg)',
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

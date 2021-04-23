<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model:value="enableTwitterIntegration">
			{{ $ts.enable }}
		</FormSwitch>

		<template v-if="enableTwitterIntegration">
			<FormInfo>Callback URL: {{ `${url}/api/tw/cb` }}</FormInfo>
		
			<FormInput v-model:value="twitterConsumerKey">
				<template #prefix><i class="fas fa-key"></i></template>
				Consumer Key
			</FormInput>

			<FormInput v-model:value="twitterConsumerSecret">
				<template #prefix><i class="fas fa-key"></i></template>
				Consumer Secret
			</FormInput>
		</template>

		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormInput from '@client/components/form/input.vue';
import FormButton from '@client/components/form/button.vue';
import FormBase from '@client/components/form/base.vue';
import FormInfo from '@client/components/form/info.vue';
import FormSuspense from '@client/components/form/suspense.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { fetchInstance } from '@client/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormBase,
		FormInfo,
		FormButton,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: 'Twitter',
				icon: 'fab fa-twitter'
			},
			enableTwitterIntegration: false,
			twitterConsumerKey: null,
			twitterConsumerSecret: null,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableTwitterIntegration = meta.enableTwitterIntegration;
			this.twitterConsumerKey = meta.twitterConsumerKey;
			this.twitterConsumerSecret = meta.twitterConsumerSecret;
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
				enableTwitterIntegration: this.enableTwitterIntegration,
				twitterConsumerKey: this.twitterConsumerKey,
				twitterConsumerSecret: this.twitterConsumerSecret,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>

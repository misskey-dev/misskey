<template>
<FormBase>
	<FormSuspense :p="init">
		<FormLink to="/instance/integrations/twitter">
			<i class="fab fa-twitter"></i> Twitter
			<template #suffix>{{ enableTwitterIntegration ? $ts.enabled : $ts.disabled }}</template>
		</FormLink>
		<FormLink to="/instance/integrations/github">
			<i class="fab fa-github"></i> GitHub
			<template #suffix>{{ enableGithubIntegration ? $ts.enabled : $ts.disabled }}</template>
		</FormLink>
		<FormLink to="/instance/integrations/discord">
			<i class="fab fa-discord"></i> Discord
			<template #suffix>{{ enableDiscordIntegration ? $ts.enabled : $ts.disabled }}</template>
		</FormLink>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormLink from '@client/components/form/link.vue';
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
		FormLink,
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
				title: this.$ts.integration,
				icon: 'fas fa-share-alt'
			},
			enableTwitterIntegration: false,
			enableGithubIntegration: false,
			enableDiscordIntegration: false,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.enableTwitterIntegration = meta.enableTwitterIntegration;
			this.enableGithubIntegration = meta.enableGithubIntegration;
			this.enableDiscordIntegration = meta.enableDiscordIntegration;
		},
	}
});
</script>

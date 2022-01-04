<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<FormLink to="/admin/integrations/twitter" class="_formBlock">
			<i class="fab fa-twitter"></i> Twitter
			<template #suffix>{{ enableTwitterIntegration ? $ts.enabled : $ts.disabled }}</template>
		</FormLink>
		<FormLink to="/admin/integrations/github" class="_formBlock">
			<i class="fab fa-github"></i> GitHub
			<template #suffix>{{ enableGithubIntegration ? $ts.enabled : $ts.disabled }}</template>
		</FormLink>
		<FormLink to="/admin/integrations/discord" class="_formBlock">
			<i class="fab fa-discord"></i> Discord
			<template #suffix>{{ enableDiscordIntegration ? $ts.enabled : $ts.disabled }}</template>
		</FormLink>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormLink from '@/components/form/link.vue';
import FormSecion from '@/components/form/section.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormLink,
		FormSecion,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.integration,
				icon: 'fas fa-share-alt',
				bg: 'var(--bg)',
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

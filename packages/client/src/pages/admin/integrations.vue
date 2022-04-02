<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<FormFolder class="_formBlock">
			<template #icon><i class="fab fa-twitter"></i></template>
			<template #label>Twitter</template>
			<template #suffix>{{ enableTwitterIntegration ? $ts.enabled : $ts.disabled }}</template>
			<XTwitter/>
		</FormFolder>
		<FormFolder to="/admin/integrations/github" class="_formBlock">
			<template #icon><i class="fab fa-github"></i></template>
			<template #label>GitHub</template>
			<template #suffix>{{ enableGithubIntegration ? $ts.enabled : $ts.disabled }}</template>
			<XGithub/>
		</FormFolder>
		<FormFolder to="/admin/integrations/discord" class="_formBlock">
			<template #icon><i class="fab fa-discord"></i></template>
			<template #label>Discord</template>
			<template #suffix>{{ enableDiscordIntegration ? $ts.enabled : $ts.disabled }}</template>
			<XDiscord/>
		</FormFolder>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormFolder from '@/components/form/folder.vue';
import FormSecion from '@/components/form/section.vue';
import FormSuspense from '@/components/form/suspense.vue';
import XTwitter from './integrations.twitter.vue';
import XGithub from './integrations.github.vue';
import XDiscord from './integrations.discord.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormFolder,
		FormSecion,
		FormSuspense,
		XTwitter,
		XGithub,
		XDiscord,
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

	methods: {
		async init() {
			const meta = await os.api('admin/meta');
			this.enableTwitterIntegration = meta.enableTwitterIntegration;
			this.enableGithubIntegration = meta.enableGithubIntegration;
			this.enableDiscordIntegration = meta.enableDiscordIntegration;
		},
	}
});
</script>

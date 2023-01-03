<template><MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<FormFolder class="_formBlock">
			<template #icon><i class="ti ti-brand-twitter"></i></template>
			<template #label>Twitter</template>
			<template #suffix>{{ enableTwitterIntegration ? i18n.ts.enabled : i18n.ts.disabled }}</template>
			<XTwitter/>
		</FormFolder>
		<FormFolder class="_formBlock">
			<template #icon><i class="ti ti-brand-github"></i></template>
			<template #label>GitHub</template>
			<template #suffix>{{ enableGithubIntegration ? i18n.ts.enabled : i18n.ts.disabled }}</template>
			<XGithub/>
		</FormFolder>
		<FormFolder class="_formBlock">
			<template #icon><i class="ti ti-brand-discord"></i></template>
			<template #label>Discord</template>
			<template #suffix>{{ enableDiscordIntegration ? i18n.ts.enabled : i18n.ts.disabled }}</template>
			<XDiscord/>
		</FormFolder>
	</FormSuspense>
</MkSpacer></MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XTwitter from './integrations.twitter.vue';
import XGithub from './integrations.github.vue';
import XDiscord from './integrations.discord.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormFolder from '@/components/form/folder.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let enableTwitterIntegration: boolean = $ref(false);
let enableGithubIntegration: boolean = $ref(false);
let enableDiscordIntegration: boolean = $ref(false);

async function init() {
	const meta = await os.api('admin/meta');
	enableTwitterIntegration = meta.enableTwitterIntegration;
	enableGithubIntegration = meta.enableGithubIntegration;
	enableDiscordIntegration = meta.enableDiscordIntegration;
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.integration,
	icon: 'ti ti-share',
});
</script>

<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<FormFolder class="_formBlock">
			<template #icon><i class="fab fa-twitter"></i></template>
			<template #label>Twitter</template>
			<template #suffix>{{ enableTwitterIntegration ? i18n.ts.enabled : i18n.ts.disabled }}</template>
			<XTwitter/>
		</FormFolder>
		<FormFolder class="_formBlock">
			<template #icon><i class="fab fa-github"></i></template>
			<template #label>GitHub</template>
			<template #suffix>{{ enableGithubIntegration ? i18n.ts.enabled : i18n.ts.disabled }}</template>
			<XGithub/>
		</FormFolder>
		<FormFolder class="_formBlock">
			<template #icon><i class="fab fa-discord"></i></template>
			<template #label>Discord</template>
			<template #suffix>{{ enableDiscordIntegration ? i18n.ts.enabled : i18n.ts.disabled }}</template>
			<XDiscord/>
		</FormFolder>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import FormFolder from '@/components/form/folder.vue';
import FormSuspense from '@/components/form/suspense.vue';
import XTwitter from './integrations.twitter.vue';
import XGithub from './integrations.github.vue';
import XDiscord from './integrations.discord.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

let enableTwitterIntegration: boolean = $ref(false);
let enableGithubIntegration: boolean = $ref(false);
let enableDiscordIntegration: boolean = $ref(false);

async function init() {
	const meta = await os.api('admin/meta');
	enableTwitterIntegration = meta.enableTwitterIntegration;
	enableGithubIntegration = meta.enableGithubIntegration;
	enableDiscordIntegration = meta.enableDiscordIntegration;
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.integration,
		icon: 'fas fa-share-alt',
		bg: 'var(--bg)',
	}
});
</script>

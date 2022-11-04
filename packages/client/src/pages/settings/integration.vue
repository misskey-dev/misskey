<template>
<div class="_formRoot">
	<FormSection v-if="instance.enableTwitterIntegration">
		<template #label><i class="fab fa-twitter"></i> Twitter</template>
		<p v-if="integrations.twitter">{{ i18n.ts.connectedTo }}: <a :href="`https://twitter.com/${integrations.twitter.screenName}`" rel="nofollow noopener" target="_blank">@{{ integrations.twitter.screenName }}</a></p>
		<MkButton v-if="integrations.twitter" danger @click="disconnectTwitter">{{ i18n.ts.disconnectService }}</MkButton>
		<MkButton v-else primary @click="connectTwitter">{{ i18n.ts.connectService }}</MkButton>
	</FormSection>

	<FormSection v-if="instance.enableDiscordIntegration">
		<template #label><i class="fab fa-discord"></i> Discord</template>
		<p v-if="integrations.discord">{{ i18n.ts.connectedTo }}: <a :href="`https://discord.com/users/${integrations.discord.id}`" rel="nofollow noopener" target="_blank">@{{ integrations.discord.username }}#{{ integrations.discord.discriminator }}</a></p>
		<MkButton v-if="integrations.discord" danger @click="disconnectDiscord">{{ i18n.ts.disconnectService }}</MkButton>
		<MkButton v-else primary @click="connectDiscord">{{ i18n.ts.connectService }}</MkButton>
	</FormSection>

	<FormSection v-if="instance.enableGithubIntegration">
		<template #label><i class="fab fa-github"></i> GitHub</template>
		<p v-if="integrations.github">{{ i18n.ts.connectedTo }}: <a :href="`https://github.com/${integrations.github.login}`" rel="nofollow noopener" target="_blank">@{{ integrations.github.login }}</a></p>
		<MkButton v-if="integrations.github" danger @click="disconnectGithub">{{ i18n.ts.disconnectService }}</MkButton>
		<MkButton v-else primary @click="connectGithub">{{ i18n.ts.connectService }}</MkButton>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { apiUrl } from '@/config';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import { $i } from '@/account';
import { instance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const twitterForm = ref<Window | null>(null);
const discordForm = ref<Window | null>(null);
const githubForm = ref<Window | null>(null);

const integrations = computed(() => $i!.integrations);

function openWindow(service: string, type: string) {
	return window.open(`${apiUrl}/${type}/${service}`,
		`${service}_${type}_window`,
		'height=570, width=520',
	);
}

function connectTwitter() {
	twitterForm.value = openWindow('twitter', 'connect');
}

function disconnectTwitter() {
	openWindow('twitter', 'disconnect');
}

function connectDiscord() {
	discordForm.value = openWindow('discord', 'connect');
}

function disconnectDiscord() {
	openWindow('discord', 'disconnect');
}

function connectGithub() {
	githubForm.value = openWindow('github', 'connect');
}

function disconnectGithub() {
	openWindow('github', 'disconnect');
}

onMounted(() => {
	document.cookie = `igi=${$i!.token}; path=/;` +
		' max-age=31536000;' +
		(document.location.protocol.startsWith('https') ? ' secure' : '');

	watch(integrations, () => {
		if (integrations.value.twitter) {
			if (twitterForm.value) twitterForm.value.close();
		}
		if (integrations.value.discord) {
			if (discordForm.value) discordForm.value.close();
		}
		if (integrations.value.github) {
			if (githubForm.value) githubForm.value.close();
		}
	});
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.integration,
	icon: 'fas fa-share-alt',
});
</script>

<template>
<div class="_formRoot">
	<FormSection v-if="enableTwitterIntegration">
		<template #label><i class="fab fa-twitter"></i> Twitter</template>
		<p v-if="integrations.twitter">{{ $ts.connectedTo }}: <a :href="`https://twitter.com/${integrations.twitter.screenName}`" rel="nofollow noopener" target="_blank">@{{ integrations.twitter.screenName }}</a></p>
		<MkButton v-if="integrations.twitter" danger @click="disconnectTwitter">{{ $ts.disconnectService }}</MkButton>
		<MkButton v-else primary @click="connectTwitter">{{ $ts.connectService }}</MkButton>
	</FormSection>

	<FormSection v-if="enableDiscordIntegration">
		<template #label><i class="fab fa-discord"></i> Discord</template>
		<p v-if="integrations.discord">{{ $ts.connectedTo }}: <a :href="`https://discord.com/users/${integrations.discord.id}`" rel="nofollow noopener" target="_blank">@{{ integrations.discord.username }}#{{ integrations.discord.discriminator }}</a></p>
		<MkButton v-if="integrations.discord" danger @click="disconnectDiscord">{{ $ts.disconnectService }}</MkButton>
		<MkButton v-else primary @click="connectDiscord">{{ $ts.connectService }}</MkButton>
	</FormSection>

	<FormSection v-if="enableGithubIntegration">
		<template #label><i class="fab fa-github"></i> GitHub</template>
		<p v-if="integrations.github">{{ $ts.connectedTo }}: <a :href="`https://github.com/${integrations.github.login}`" rel="nofollow noopener" target="_blank">@{{ integrations.github.login }}</a></p>
		<MkButton v-if="integrations.github" danger @click="disconnectGithub">{{ $ts.disconnectService }}</MkButton>
		<MkButton v-else primary @click="connectGithub">{{ $ts.connectService }}</MkButton>
	</FormSection>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { apiUrl } from '@/config';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormSection,
		MkButton
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.integration,
				icon: 'fas fa-share-alt',
				bg: 'var(--bg)',
			},
			apiUrl,
			twitterForm: null,
			discordForm: null,
			githubForm: null,
			enableTwitterIntegration: false,
			enableDiscordIntegration: false,
			enableGithubIntegration: false,
		};
	},

	computed: {
		integrations() {
			return this.$i.integrations;
		},
		
		meta() {
			return this.$instance;
		},
	},

	created() {
		this.enableTwitterIntegration = this.meta.enableTwitterIntegration;
		this.enableDiscordIntegration = this.meta.enableDiscordIntegration;
		this.enableGithubIntegration = this.meta.enableGithubIntegration;
	},

	mounted() {
		document.cookie = `igi=${this.$i.token}; path=/;` +
			` max-age=31536000;` +
			(document.location.protocol.startsWith('https') ? ' secure' : '');

		this.$watch('integrations', () => {
			if (this.integrations.twitter) {
				if (this.twitterForm) this.twitterForm.close();
			}
			if (this.integrations.discord) {
				if (this.discordForm) this.discordForm.close();
			}
			if (this.integrations.github) {
				if (this.githubForm) this.githubForm.close();
			}
		}, {
			deep: true
		});
	},

	methods: {
		connectTwitter() {
			this.twitterForm = window.open(apiUrl + '/connect/twitter',
				'twitter_connect_window',
				'height=570, width=520');
		},

		disconnectTwitter() {
			window.open(apiUrl + '/disconnect/twitter',
				'twitter_disconnect_window',
				'height=570, width=520');
		},

		connectDiscord() {
			this.discordForm = window.open(apiUrl + '/connect/discord',
				'discord_connect_window',
				'height=570, width=520');
		},

		disconnectDiscord() {
			window.open(apiUrl + '/disconnect/discord',
				'discord_disconnect_window',
				'height=570, width=520');
		},

		connectGithub() {
			this.githubForm = window.open(apiUrl + '/connect/github',
				'github_connect_window',
				'height=570, width=520');
		},

		disconnectGithub() {
			window.open(apiUrl + '/disconnect/github',
				'github_disconnect_window',
				'height=570, width=520');
		},
	}
});
</script>

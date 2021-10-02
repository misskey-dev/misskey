<template>
<FormBase>
	<div class="_debobigegoItem" v-if="enableTwitterIntegration">
		<div class="_debobigegoLabel"><i class="fab fa-twitter"></i> Twitter</div>
		<div class="_debobigegoPanel" style="padding: 16px;">
			<p v-if="integrations.twitter">{{ $ts.connectedTo }}: <a :href="`https://twitter.com/${integrations.twitter.screenName}`" rel="nofollow noopener" target="_blank">@{{ integrations.twitter.screenName }}</a></p>
			<MkButton v-if="integrations.twitter" @click="disconnectTwitter" danger>{{ $ts.disconnectService }}</MkButton>
			<MkButton v-else @click="connectTwitter" primary>{{ $ts.connectService }}</MkButton>
		</div>
	</div>

	<div class="_debobigegoItem" v-if="enableDiscordIntegration">
		<div class="_debobigegoLabel"><i class="fab fa-discord"></i> Discord</div>
		<div class="_debobigegoPanel" style="padding: 16px;">
			<p v-if="integrations.discord">{{ $ts.connectedTo }}: <a :href="`https://discord.com/users/${integrations.discord.id}`" rel="nofollow noopener" target="_blank">@{{ integrations.discord.username }}#{{ integrations.discord.discriminator }}</a></p>
			<MkButton v-if="integrations.discord" @click="disconnectDiscord" danger>{{ $ts.disconnectService }}</MkButton>
			<MkButton v-else @click="connectDiscord" primary>{{ $ts.connectService }}</MkButton>
		</div>
	</div>

	<div class="_debobigegoItem" v-if="enableGithubIntegration">
		<div class="_debobigegoLabel"><i class="fab fa-github"></i> GitHub</div>
		<div class="_debobigegoPanel" style="padding: 16px;">
			<p v-if="integrations.github">{{ $ts.connectedTo }}: <a :href="`https://github.com/${integrations.github.login}`" rel="nofollow noopener" target="_blank">@{{ integrations.github.login }}</a></p>
			<MkButton v-if="integrations.github" @click="disconnectGithub" danger>{{ $ts.disconnectService }}</MkButton>
			<MkButton v-else @click="connectGithub" primary>{{ $ts.connectService }}</MkButton>
		</div>
	</div>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { apiUrl } from '@client/config';
import FormBase from '@client/components/debobigego/base.vue';
import MkButton from '@client/components/ui/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
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
		this.$emit('info', this[symbols.PAGE_INFO]);

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

<template>
<section class="_card" v-if="enableTwitterIntegration || enableDiscordIntegration || enableGithubIntegration">
	<div class="_title"><fa :icon="faShareAlt"/> {{ $t('integration') }}</div>

	<div class="_content" v-if="enableTwitterIntegration">
		<header><fa :icon="faTwitter"/> Twitter</header>
		<p v-if="integrations.twitter">{{ $t('connectedTo') }}: <a :href="`https://twitter.com/${integrations.twitter.screenName}`" rel="nofollow noopener" target="_blank">@{{ integrations.twitter.screenName }}</a></p>
		<mk-button v-if="integrations.twitter" @click="disconnectTwitter">{{ $t('disconnectSerice') }}</mk-button>
		<mk-button v-else @click="connectTwitter">{{ $t('connectSerice') }}</mk-button>
	</div>

	<div class="_content" v-if="enableDiscordIntegration">
		<header><fa :icon="faDiscord"/> Discord</header>
		<p v-if="integrations.discord">{{ $t('connectedTo') }}: <a :href="`https://discordapp.com/users/${integrations.discord.id}`" rel="nofollow noopener" target="_blank">@{{ integrations.discord.username }}#{{ integrations.discord.discriminator }}</a></p>
		<mk-button v-if="integrations.discord" @click="disconnectDiscord">{{ $t('disconnectSerice') }}</mk-button>
		<mk-button v-else @click="connectDiscord">{{ $t('connectSerice') }}</mk-button>
	</div>

	<div class="_content" v-if="enableGithubIntegration">
		<header><fa :icon="faGithub"/> GitHub</header>
		<p v-if="integrations.github">{{ $t('connectedTo') }}: <a :href="`https://github.com/${integrations.github.login}`" rel="nofollow noopener" target="_blank">@{{ integrations.github.login }}</a></p>
		<mk-button v-if="integrations.github" @click="disconnectGithub">{{ $t('disconnectSerice') }}</mk-button>
		<mk-button v-else @click="connectGithub">{{ $t('connectSerice') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import i18n from '../../i18n';
import { apiUrl } from '../../config';
import MkButton from '../../components/ui/button.vue';

export default Vue.extend({
	i18n,

	components: {
		MkButton
	},

	data() {
		return {
			apiUrl,
			twitterForm: null,
			discordForm: null,
			githubForm: null,
			enableTwitterIntegration: false,
			enableDiscordIntegration: false,
			enableGithubIntegration: false,
			faShareAlt, faTwitter, faDiscord, faGithub
		};
	},

	computed: {
		integrations() {
			return this.$store.state.i.integrations;
		},
		
		meta() {
			return this.$store.state.instance.meta;
		},
	},

	created() {
		this.enableTwitterIntegration = this.meta.enableTwitterIntegration;
		this.enableDiscordIntegration = this.meta.enableDiscordIntegration;
		this.enableGithubIntegration = this.meta.enableGithubIntegration;
	},

	mounted() {
		document.cookie = `i=${this.$store.state.i.token}; path=/;` +
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

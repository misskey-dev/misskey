<template>
<ui-card v-if="enableTwitterIntegration || enableDiscordIntegration || enableGithubIntegration">
	<template #title><fa icon="share-alt"/> {{ $t('title') }}</template>

	<section v-if="enableTwitterIntegration">
		<header><fa :icon="['fab', 'twitter']"/> Twitter</header>
		<p v-if="$store.state.i.twitter">{{ $t('connected-to') }}: <a :href="`https://twitter.com/${$store.state.i.twitter.screenName}`" target="_blank">@{{ $store.state.i.twitter.screenName }}</a></p>
		<ui-button v-if="$store.state.i.twitter" @click="disconnectTwitter">{{ $t('disconnect') }}</ui-button>
		<ui-button v-else @click="connectTwitter">{{ $t('connect') }}</ui-button>
	</section>

	<section v-if="enableDiscordIntegration">
		<header><fa :icon="['fab', 'discord']"/> Discord</header>
		<p v-if="$store.state.i.discord">{{ $t('connected-to') }}: <a :href="`https://discordapp.com/users/${$store.state.i.discord.id}`" target="_blank">@{{ $store.state.i.discord.username }}#{{ $store.state.i.discord.discriminator }}</a></p>
		<ui-button v-if="$store.state.i.discord" @click="disconnectDiscord">{{ $t('disconnect') }}</ui-button>
		<ui-button v-else @click="connectDiscord">{{ $t('connect') }}</ui-button>
	</section>

	<section v-if="enableGithubIntegration">
		<header><fa :icon="['fab', 'github']"/> GitHub</header>
		<p v-if="$store.state.i.github">{{ $t('connected-to') }}: <a :href="`https://github.com/${$store.state.i.github.login}`" target="_blank">@{{ $store.state.i.github.login }}</a></p>
		<ui-button v-if="$store.state.i.github" @click="disconnectGithub">{{ $t('disconnect') }}</ui-button>
		<ui-button v-else @click="connectGithub">{{ $t('connect') }}</ui-button>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl } from '../../../config';

export default Vue.extend({
	i18n: i18n('common/views/components/integration-settings.vue'),

	data() {
		return {
			apiUrl,
			twitterForm: null,
			discordForm: null,
			githubForm: null,
			enableTwitterIntegration: false,
			enableDiscordIntegration: false,
			enableGithubIntegration: false,
		};
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.enableTwitterIntegration = meta.enableTwitterIntegration;
			this.enableDiscordIntegration = meta.enableDiscordIntegration;
			this.enableGithubIntegration = meta.enableGithubIntegration;
		});
	},

	mounted() {
		document.cookie = `i=${this.$store.state.i.token}`;
		this.$watch('$store.state.i', () => {
			if (this.$store.state.i.twitter) {
				if (this.twitterForm) this.twitterForm.close();
			}
			if (this.$store.state.i.discord) {
				if (this.discordForm) this.discordForm.close();
			}
			if (this.$store.state.i.github) {
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

<style lang="stylus" scoped>
</style>

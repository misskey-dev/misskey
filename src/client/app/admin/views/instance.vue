<template>
<div class="axbwjelsbymowqjyywpirzhdlszoncqs">
	<ui-card>
		<div slot="title"><fa icon="cog"/> {{ $t('instance') }}</div>
		<section class="fit-top fit-bottom">
			<ui-input :value="host" readonly>{{ $t('host') }}</ui-input>
			<ui-input v-model="name">{{ $t('instance-name') }}</ui-input>
			<ui-textarea v-model="description">{{ $t('instance-description') }}</ui-textarea>
			<ui-input v-model="bannerUrl"><i slot="icon"><fa icon="link"/></i>{{ $t('banner-url') }}</ui-input>
			<ui-input v-model="languages"><i slot="icon"><fa icon="language"/></i>{{ $t('languages') }}<span slot="desc">{{ $t('languages-desc') }}</span></ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa :icon="faHeadset"/> {{ $t('maintainer-config') }}</header>
			<ui-input v-model="maintainerName">{{ $t('maintainer-name') }}</ui-input>
			<ui-input v-model="maintainerEmail" type="email"><i slot="icon"><fa :icon="['far', 'envelope']"/></i>{{ $t('maintainer-email') }}</ui-input>
		</section>
		<section class="fit-top fit-bottom">
			<ui-input v-model="maxNoteTextLength">{{ $t('max-note-text-length') }}</ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa icon="cloud"/> {{ $t('drive-config') }}</header>
			<ui-switch v-model="cacheRemoteFiles">{{ $t('cache-remote-files') }}<span slot="desc">{{ $t('cache-remote-files-desc') }}</span></ui-switch>
			<ui-input v-model="localDriveCapacityMb" type="number">{{ $t('local-drive-capacity-mb') }}<span slot="suffix">MB</span><span slot="desc">{{ $t('mb') }}</span></ui-input>
			<ui-input v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles">{{ $t('remote-drive-capacity-mb') }}<span slot="suffix">MB</span><span slot="desc">{{ $t('mb') }}</span></ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa :icon="faShieldAlt"/> {{ $t('recaptcha-config') }}</header>
			<ui-switch v-model="enableRecaptcha">{{ $t('enable-recaptcha') }}</ui-switch>
			<ui-info>{{ $t('recaptcha-info') }}</ui-info>
			<ui-input v-model="recaptchaSiteKey" :disabled="!enableRecaptcha"><i slot="icon"><fa icon="key"/></i>{{ $t('recaptcha-site-key') }}</ui-input>
			<ui-input v-model="recaptchaSecretKey" :disabled="!enableRecaptcha"><i slot="icon"><fa icon="key"/></i>{{ $t('recaptcha-secret-key') }}</ui-input>
		</section>
		<section>
			<header><fa :icon="faGhost"/> {{ $t('proxy-account-config') }}</header>
			<ui-info>{{ $t('proxy-account-info') }}</ui-info>
			<ui-input v-model="proxyAccount"><span slot="prefix">@</span>{{ $t('proxy-account-username') }}<span slot="desc">{{ $t('proxy-account-username-desc') }}</span></ui-input>
			<ui-info warn>{{ $t('proxy-account-warn') }}</ui-info>
		</section>
		<section>
			<ui-switch v-model="disableRegistration">{{ $t('disable-registration') }}</ui-switch>
		</section>
		<section>
			<ui-switch v-model="disableLocalTimeline">{{ $t('disable-local-timeline') }}</ui-switch>
		</section>
		<section>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">{{ $t('invite') }}</div>
		<section>
			<ui-button @click="invite">{{ $t('invite') }}</ui-button>
			<p v-if="inviteCode">Code: <code>{{ inviteCode }}</code></p>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title"><fa :icon="['fab', 'twitter']"/> {{ $t('twitter-integration-config') }}</div>
		<section>
			<ui-switch v-model="enableTwitterIntegration">{{ $t('enable-twitter-integration') }}</ui-switch>
			<ui-info>{{ $t('twitter-integration-info') }}</ui-info>
			<ui-input v-model="twitterConsumerKey" :disabled="!enableTwitterIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('twitter-integration-consumer-key') }}</ui-input>
			<ui-input v-model="twitterConsumerSecret" :disabled="!enableTwitterIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('twitter-integration-consumer-secret') }}</ui-input>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title"><fa :icon="['fab', 'github']"/> {{ $t('github-integration-config') }}</div>
		<section>
			<ui-switch v-model="enableGithubIntegration">{{ $t('enable-github-integration') }}</ui-switch>
			<ui-info>{{ $t('github-integration-info') }}</ui-info>
			<ui-input v-model="githubClientId" :disabled="!enableGithubIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('github-integration-client-id') }}</ui-input>
			<ui-input v-model="githubClientSecret" :disabled="!enableGithubIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('github-integration-client-secret') }}</ui-input>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title"><fa :icon="['fab', 'discord']"/> {{ $t('discord-integration-config') }}</div>
		<section>
			<ui-switch v-model="enableDiscordIntegration">{{ $t('enable-discord-integration') }}</ui-switch>
			<ui-info>{{ $t('discord-integration-info') }}</ui-info>
			<ui-input v-model="discordClientId" :disabled="!enableDiscordIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('discord-integration-client-id') }}</ui-input>
			<ui-input v-model="discordClientSecret" :disabled="!enableDiscordIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('discord-integration-client-secret') }}</ui-input>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { host } from '../../config';
import { toUnicode } from 'punycode';
import { faHeadset, faShieldAlt, faGhost } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/instance.vue'),

	data() {
		return {
			host: toUnicode(host),
			maintainerName: null,
			maintainerEmail: null,
			disableRegistration: false,
			disableLocalTimeline: false,
			bannerUrl: null,
			name: null,
			description: null,
			languages: null,
			cacheRemoteFiles: false,
			localDriveCapacityMb: null,
			remoteDriveCapacityMb: null,
			maxNoteTextLength: null,
			enableRecaptcha: false,
			recaptchaSiteKey: null,
			recaptchaSecretKey: null,
			enableTwitterIntegration: false,
			twitterConsumerKey: null,
			twitterConsumerSecret: null,
			enableGithubIntegration: false,
			githubClientId: null,
			githubClientSecret: null,
			enableDiscordIntegration: false,
			discordClientId: null,
			discordClientSecret: null,
			proxyAccount: null,
			inviteCode: null,
			faHeadset, faShieldAlt, faGhost
		};
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.maintainerName = meta.maintainer.name;
			this.maintainerEmail = meta.maintainer.email;
			this.bannerUrl = meta.bannerUrl;
			this.name = meta.name;
			this.description = meta.description;
			this.languages = meta.langs.join(' ');
			this.cacheRemoteFiles = meta.cacheRemoteFiles;
			this.localDriveCapacityMb = meta.driveCapacityPerLocalUserMb;
			this.remoteDriveCapacityMb = meta.driveCapacityPerRemoteUserMb;
			this.maxNoteTextLength = meta.maxNoteTextLength;
			this.enableRecaptcha = meta.enableRecaptcha;
			this.recaptchaSiteKey = meta.recaptchaSiteKey;
			this.recaptchaSecretKey = meta.recaptchaSecretKey;
			this.proxyAccount = meta.proxyAccount;
			this.enableTwitterIntegration = meta.enableTwitterIntegration;
			this.twitterConsumerKey = meta.twitterConsumerKey;
			this.twitterConsumerSecret = meta.twitterConsumerSecret;
			this.enableGithubIntegration = meta.enableGithubIntegration;
			this.githubClientId = meta.githubClientId;
			this.githubClientSecret = meta.githubClientSecret;
			this.enableDiscordIntegration = meta.enableDiscordIntegration;
			this.discordClientId = meta.discordClientId;
			this.discordClientSecret = meta.discordClientSecret;
		});
	},

	methods: {
		invite() {
			this.$root.api('admin/invite').then(x => {
				this.inviteCode = x.code;
			}).catch(e => {
				this.$root.alert({
					type: 'error',
					text: e
				});
			});
		},

		updateMeta() {
			this.$root.api('admin/update-meta', {
				maintainerName: this.maintainerName,
				maintainerEmail: this.maintainerEmail,
				disableRegistration: this.disableRegistration,
				disableLocalTimeline: this.disableLocalTimeline,
				bannerUrl: this.bannerUrl,
				name: this.name,
				description: this.description,
				langs: this.languages.split(' '),
				cacheRemoteFiles: this.cacheRemoteFiles,
				localDriveCapacityMb: parseInt(this.localDriveCapacityMb, 10),
				remoteDriveCapacityMb: parseInt(this.remoteDriveCapacityMb, 10),
				maxNoteTextLength: parseInt(this.maxNoteTextLength, 10),
				enableRecaptcha: this.enableRecaptcha,
				recaptchaSiteKey: this.recaptchaSiteKey,
				recaptchaSecretKey: this.recaptchaSecretKey,
				proxyAccount: this.proxyAccount,
				enableTwitterIntegration: this.enableTwitterIntegration,
				twitterConsumerKey: this.twitterConsumerKey,
				twitterConsumerSecret: this.twitterConsumerSecret,
				enableGithubIntegration: this.enableGithubIntegration,
				githubClientId: this.githubClientId,
				githubClientSecret: this.githubClientSecret,
				enableDiscordIntegration: this.enableDiscordIntegration,
				discordClientId: this.discordClientId,
				discordClientSecret: this.discordClientSecret
			}).then(() => {
				this.$root.alert({
					type: 'success',
					text: this.$t('saved')
				});
			}).catch(e => {
				this.$root.alert({
					type: 'error',
					text: e
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.axbwjelsbymowqjyywpirzhdlszoncqs
	@media (min-width 500px)
		padding 16px

</style>

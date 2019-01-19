<template>
<div>
	<ui-card>
		<div slot="title"><fa icon="cog"/> {{ $t('instance') }}</div>
		<section class="fit-top fit-bottom">
			<ui-input :value="host" readonly>{{ $t('host') }}</ui-input>
			<ui-input v-model="name">{{ $t('instance-name') }}</ui-input>
			<ui-textarea v-model="description">{{ $t('instance-description') }}</ui-textarea>
			<ui-input v-model="mascotImageUrl"><i slot="icon"><fa icon="link"/></i>{{ $t('logo-url') }}</ui-input>
			<ui-input v-model="bannerUrl"><i slot="icon"><fa icon="link"/></i>{{ $t('banner-url') }}</ui-input>
			<ui-input v-model="errorImageUrl"><i slot="icon"><fa icon="link"/></i>{{ $t('error-image-url') }}</ui-input>
			<ui-input v-model="languages"><i slot="icon"><fa icon="language"/></i>{{ $t('languages') }}<span slot="desc">{{ $t('languages-desc') }}</span></ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa :icon="faHeadset"/> {{ $t('maintainer-config') }}</header>
			<ui-input v-model="maintainerName">{{ $t('maintainer-name') }}</ui-input>
			<ui-input v-model="maintainerEmail" type="email"><i slot="icon"><fa :icon="farEnvelope"/></i>{{ $t('maintainer-email') }}</ui-input>
		</section>
		<section class="fit-top fit-bottom">
			<ui-input v-model="maxNoteTextLength">{{ $t('max-note-text-length') }}</ui-input>
		</section>
		<section>
			<ui-switch v-model="disableRegistration">{{ $t('disable-registration') }}</ui-switch>
			<ui-switch v-model="disableLocalTimeline">{{ $t('disable-local-timeline') }}</ui-switch>
			<ui-switch v-model="disableGlobalTimeline">{{ $t('disable-global-timeline') }}</ui-switch>
			<ui-info>{{ $t('disabling-timelines-info') }}</ui-info>
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
			<ui-horizon-group inputs>
				<ui-input v-model="recaptchaSiteKey" :disabled="!enableRecaptcha"><i slot="icon"><fa icon="key"/></i>{{ $t('recaptcha-site-key') }}</ui-input>
				<ui-input v-model="recaptchaSecretKey" :disabled="!enableRecaptcha"><i slot="icon"><fa icon="key"/></i>{{ $t('recaptcha-secret-key') }}</ui-input>
			</ui-horizon-group>
		</section>
		<section>
			<header><fa :icon="faGhost"/> {{ $t('proxy-account-config') }}</header>
			<ui-info>{{ $t('proxy-account-info') }}</ui-info>
			<ui-input v-model="proxyAccount"><span slot="prefix">@</span>{{ $t('proxy-account-username') }}<span slot="desc">{{ $t('proxy-account-username-desc') }}</span></ui-input>
			<ui-info warn>{{ $t('proxy-account-warn') }}</ui-info>
		</section>
		<section>
			<header><fa :icon="farEnvelope"/> {{ $t('email-config') }}</header>
			<ui-switch v-model="enableEmail">{{ $t('enable-email') }}<span slot="desc">{{ $t('email-config-info') }}</span></ui-switch>
			<ui-input v-model="email" type="email" :disabled="!enableEmail">{{ $t('email') }}</ui-input>
			<ui-horizon-group inputs>
				<ui-input v-model="smtpHost" :disabled="!enableEmail">{{ $t('smtp-host') }}</ui-input>
				<ui-input v-model="smtpPort" type="number" :disabled="!enableEmail">{{ $t('smtp-port') }}</ui-input>
			</ui-horizon-group>
			<ui-horizon-group inputs>
				<ui-input v-model="smtpUser" :disabled="!enableEmail">{{ $t('smtp-user') }}</ui-input>
				<ui-input v-model="smtpPass" type="password" :withPasswordToggle="true" :disabled="!enableEmail">{{ $t('smtp-pass') }}</ui-input>
			</ui-horizon-group>
			<ui-switch v-model="smtpSecure" :disabled="!enableEmail">{{ $t('smtp-secure') }}<span slot="desc">{{ $t('smtp-secure-info') }}</span></ui-switch>
		</section>
		<section>
			<header><fa :icon="faBolt"/> {{ $t('serviceworker-config') }}</header>
			<ui-switch v-model="enableServiceWorker">{{ $t('enable-serviceworker') }}<span slot="desc">{{ $t('serviceworker-info') }}</span></ui-switch>
			<ui-info>{{ $t('vapid-info') }}<br><code>npm i web-push -g<br>web-push generate-vapid-keys</code></ui-info>
			<ui-horizon-group inputs class="fit-bottom">
				<ui-input v-model="swPublicKey" :disabled="!enableServiceWorker"><i slot="icon"><fa icon="key"/></i>{{ $t('vapid-publickey') }}</ui-input>
				<ui-input v-model="swPrivateKey" :disabled="!enableServiceWorker"><i slot="icon"><fa icon="key"/></i>{{ $t('vapid-privatekey') }}</ui-input>
			</ui-horizon-group>
		</section>
		<section>
			<header>summaly Proxy</header>
			<ui-input v-model="summalyProxy">URL</ui-input>
		</section>
		<section>
			<header><fa :icon="faUserPlus"/> {{ $t('user-recommendation-config') }}</header>
			<ui-switch v-model="enableExternalUserRecommendation">{{ $t('enable-external-user-recommendation') }}</ui-switch>
			<ui-input v-model="externalUserRecommendationEngine" :disabled="!enableExternalUserRecommendation">{{ $t('external-user-recommendation-engine') }}<span slot="desc">{{ $t('external-user-recommendation-engine-desc') }}</span></ui-input>
			<ui-input v-model="externalUserRecommendationTimeout" type="number" :disabled="!enableExternalUserRecommendation">{{ $t('external-user-recommendation-timeout') }}<span slot="suffix">ms</span><span slot="desc">{{ $t('external-user-recommendation-timeout-desc') }}</span></ui-input>
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
			<ui-horizon-group>
				<ui-input v-model="twitterConsumerKey" :disabled="!enableTwitterIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('twitter-integration-consumer-key') }}</ui-input>
				<ui-input v-model="twitterConsumerSecret" :disabled="!enableTwitterIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('twitter-integration-consumer-secret') }}</ui-input>
			</ui-horizon-group>
			<ui-info>{{ $t('twitter-integration-info', { url: `${url}/api/tw/cb` }) }}</ui-info>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title"><fa :icon="['fab', 'github']"/> {{ $t('github-integration-config') }}</div>
		<section>
			<ui-switch v-model="enableGithubIntegration">{{ $t('enable-github-integration') }}</ui-switch>
			<ui-horizon-group>
				<ui-input v-model="githubClientId" :disabled="!enableGithubIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('github-integration-client-id') }}</ui-input>
				<ui-input v-model="githubClientSecret" :disabled="!enableGithubIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('github-integration-client-secret') }}</ui-input>
			</ui-horizon-group>
			<ui-info>{{ $t('github-integration-info', { url: `${url}/api/gh/cb` }) }}</ui-info>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title"><fa :icon="['fab', 'discord']"/> {{ $t('discord-integration-config') }}</div>
		<section>
			<ui-switch v-model="enableDiscordIntegration">{{ $t('enable-discord-integration') }}</ui-switch>
			<ui-horizon-group>
				<ui-input v-model="discordClientId" :disabled="!enableDiscordIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('discord-integration-client-id') }}</ui-input>
				<ui-input v-model="discordClientSecret" :disabled="!enableDiscordIntegration"><i slot="icon"><fa icon="key"/></i>{{ $t('discord-integration-client-secret') }}</ui-input>
			</ui-horizon-group>
			<ui-info>{{ $t('discord-integration-info', { url: `${url}/api/dc/cb` }) }}</ui-info>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { url, host } from '../../config';
import { toUnicode } from 'punycode';
import { faHeadset, faShieldAlt, faGhost, faUserPlus, faBolt } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope as farEnvelope } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/instance.vue'),

	data() {
		return {
			url,
			host: toUnicode(host),
			maintainerName: null,
			maintainerEmail: null,
			disableRegistration: false,
			disableLocalTimeline: false,
			disableGlobalTimeline: false,
			mascotImageUrl: null,
			bannerUrl: null,
			errorImageUrl: null,
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
			enableExternalUserRecommendation: false,
			externalUserRecommendationEngine: null,
			externalUserRecommendationTimeout: null,
			summalyProxy: null,
			enableEmail: false,
			email: null,
			smtpSecure: false,
			smtpHost: null,
			smtpPort: null,
			smtpUser: null,
			smtpPass: null,
			enableServiceWorker: false,
			swPublicKey: null,
			swPrivateKey: null,
			faHeadset, faShieldAlt, faGhost, faUserPlus, farEnvelope, faBolt
		};
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.maintainerName = meta.maintainer.name;
			this.maintainerEmail = meta.maintainer.email;
			this.disableRegistration = meta.disableRegistration;
			this.disableLocalTimeline = meta.disableLocalTimeline;
			this.disableGlobalTimeline = meta.disableGlobalTimeline;
			this.mascotImageUrl = meta.mascotImageUrl;
			this.bannerUrl = meta.bannerUrl;
			this.errorImageUrl = meta.errorImageUrl;
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
			this.enableExternalUserRecommendation = meta.enableExternalUserRecommendation;
			this.externalUserRecommendationEngine = meta.externalUserRecommendationEngine;
			this.externalUserRecommendationTimeout = meta.externalUserRecommendationTimeout;
			this.summalyProxy = meta.summalyProxy;
			this.enableEmail = meta.enableEmail;
			this.email = meta.email;
			this.smtpSecure = meta.smtpSecure;
			this.smtpHost = meta.smtpHost;
			this.smtpPort = meta.smtpPort;
			this.smtpUser = meta.smtpUser;
			this.smtpPass = meta.smtpPass;
			this.enableServiceWorker = meta.enableServiceWorker;
			this.swPublicKey = meta.swPublickey;
			this.swPrivateKey = meta.swPrivateKey;
		});
	},

	methods: {
		invite() {
			this.$root.api('admin/invite').then(x => {
				this.inviteCode = x.code;
			}).catch(e => {
				this.$root.dialog({
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
				disableGlobalTimeline: this.disableGlobalTimeline,
				mascotImageUrl: this.mascotImageUrl,
				bannerUrl: this.bannerUrl,
				errorImageUrl: this.errorImageUrl,
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
				discordClientSecret: this.discordClientSecret,
				enableExternalUserRecommendation: this.enableExternalUserRecommendation,
				externalUserRecommendationEngine: this.externalUserRecommendationEngine,
				externalUserRecommendationTimeout: parseInt(this.externalUserRecommendationTimeout, 10),
				summalyProxy: this.summalyProxy,
				enableEmail: this.enableEmail,
				email: this.email,
				smtpSecure: this.smtpSecure,
				smtpHost: this.smtpHost,
				smtpPort: parseInt(this.smtpPort, 10),
				smtpUser: this.smtpUser,
				smtpPass: this.smtpPass,
				enableServiceWorker: this.enableServiceWorker,
				swPublicKey: this.swPublicKey,
				swPrivateKey: this.swPrivateKey
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					text: this.$t('saved')
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
		}
	}
});
</script>

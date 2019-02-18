<template>
<div>
	<ui-card>
		<template #title><fa icon="cog"/> {{ $t('instance') }}</template>
		<section class="fit-top fit-bottom">
			<ui-input :value="host" readonly>{{ $t('host') }}</ui-input>
			<ui-input v-model="name">{{ $t('instance-name') }}</ui-input>
			<ui-textarea v-model="description">{{ $t('instance-description') }}</ui-textarea>
			<ui-input v-model="mascotImageUrl"><template #icon><fa icon="link"/></template>{{ $t('logo-url') }}</ui-input>
			<ui-input v-model="bannerUrl"><template #icon><fa icon="link"/></template>{{ $t('banner-url') }}</ui-input>
			<ui-input v-model="errorImageUrl"><template #icon><fa icon="link"/></template>{{ $t('error-image-url') }}</ui-input>
			<ui-input v-model="languages"><template #icon><fa icon="language"/></template>{{ $t('languages') }}<template #desc>{{ $t('languages-desc') }}</template></ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa :icon="faHeadset"/> {{ $t('maintainer-config') }}</header>
			<ui-input v-model="maintainerName">{{ $t('maintainer-name') }}</ui-input>
			<ui-input v-model="maintainerEmail" type="email"><template #icon><fa :icon="farEnvelope"/></template>{{ $t('maintainer-email') }}</ui-input>
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
			<ui-switch v-model="cacheRemoteFiles">{{ $t('cache-remote-files') }}<template #desc>{{ $t('cache-remote-files-desc') }}</template></ui-switch>
			<ui-input v-model="localDriveCapacityMb" type="number">{{ $t('local-drive-capacity-mb') }}<template #suffix>MB</template><template #desc>{{ $t('mb') }}</template></ui-input>
			<ui-input v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles">{{ $t('remote-drive-capacity-mb') }}<template #suffix>MB</template><template #desc>{{ $t('mb') }}</template></ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa :icon="faShieldAlt"/> {{ $t('recaptcha-config') }}</header>
			<ui-switch v-model="enableRecaptcha">{{ $t('enable-recaptcha') }}</ui-switch>
			<ui-info>{{ $t('recaptcha-info') }}</ui-info>
			<ui-horizon-group inputs>
				<ui-input v-model="recaptchaSiteKey" :disabled="!enableRecaptcha"><template #icon><fa icon="key"/></template>{{ $t('recaptcha-site-key') }}</ui-input>
				<ui-input v-model="recaptchaSecretKey" :disabled="!enableRecaptcha"><template #icon><fa icon="key"/></template>{{ $t('recaptcha-secret-key') }}</ui-input>
			</ui-horizon-group>
		</section>
		<section>
			<header><fa :icon="faGhost"/> {{ $t('proxy-account-config') }}</header>
			<ui-info>{{ $t('proxy-account-info') }}</ui-info>
			<ui-input v-model="proxyAccount"><template #prefix>@</template>{{ $t('proxy-account-username') }}<template #desc>{{ $t('proxy-account-username-desc') }}</template></ui-input>
			<ui-info warn>{{ $t('proxy-account-warn') }}</ui-info>
		</section>
		<section>
			<header><fa :icon="farEnvelope"/> {{ $t('email-config') }}</header>
			<ui-switch v-model="enableEmail">{{ $t('enable-email') }}<template #desc>{{ $t('email-config-info') }}</template></ui-switch>
			<ui-input v-model="email" type="email" :disabled="!enableEmail">{{ $t('email') }}</ui-input>
			<ui-horizon-group inputs>
				<ui-input v-model="smtpHost" :disabled="!enableEmail">{{ $t('smtp-host') }}</ui-input>
				<ui-input v-model="smtpPort" type="number" :disabled="!enableEmail">{{ $t('smtp-port') }}</ui-input>
			</ui-horizon-group>
			<ui-switch v-model="smtpAuth">{{ $t('smtp-auth') }}</ui-switch>
			<ui-horizon-group inputs>
				<ui-input v-model="smtpUser" :disabled="!enableEmail || !smtpAuth">{{ $t('smtp-user') }}</ui-input>
				<ui-input v-model="smtpPass" type="password" :withPasswordToggle="true" :disabled="!enableEmail || !smtpAuth">{{ $t('smtp-pass') }}</ui-input>
			</ui-horizon-group>
			<ui-switch v-model="smtpSecure" :disabled="!enableEmail">{{ $t('smtp-secure') }}<template #desc>{{ $t('smtp-secure-info') }}</template></ui-switch>
		</section>
		<section>
			<header><fa :icon="faBolt"/> {{ $t('serviceworker-config') }}</header>
			<ui-switch v-model="enableServiceWorker">{{ $t('enable-serviceworker') }}<template #desc>{{ $t('serviceworker-info') }}</template></ui-switch>
			<ui-info>{{ $t('vapid-info') }}<br><code>npm i web-push -g<br>web-push generate-vapid-keys</code></ui-info>
			<ui-horizon-group inputs class="fit-bottom">
				<ui-input v-model="swPublicKey" :disabled="!enableServiceWorker"><template #icon><fa icon="key"/></template>{{ $t('vapid-publickey') }}</ui-input>
				<ui-input v-model="swPrivateKey" :disabled="!enableServiceWorker"><template #icon><fa icon="key"/></template>{{ $t('vapid-privatekey') }}</ui-input>
			</ui-horizon-group>
		</section>
		<section>
			<header>summaly Proxy</header>
			<ui-input v-model="summalyProxy">URL</ui-input>
		</section>
		<section>
			<header><fa :icon="faUserPlus"/> {{ $t('user-recommendation-config') }}</header>
			<ui-switch v-model="enableExternalUserRecommendation">{{ $t('enable-external-user-recommendation') }}</ui-switch>
			<ui-input v-model="externalUserRecommendationEngine" :disabled="!enableExternalUserRecommendation">{{ $t('external-user-recommendation-engine') }}<template #desc>{{ $t('external-user-recommendation-engine-desc') }}</template></ui-input>
			<ui-input v-model="externalUserRecommendationTimeout" type="number" :disabled="!enableExternalUserRecommendation">{{ $t('external-user-recommendation-timeout') }}<template #suffix>ms</template><template #desc>{{ $t('external-user-recommendation-timeout-desc') }}</template></ui-input>
		</section>
		<section>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title>{{ $t('invite') }}</template>
		<section>
			<ui-button @click="invite">{{ $t('invite') }}</ui-button>
			<p v-if="inviteCode">Code: <code>{{ inviteCode }}</code></p>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="['fab', 'twitter']"/> {{ $t('twitter-integration-config') }}</template>
		<section>
			<ui-switch v-model="enableTwitterIntegration">{{ $t('enable-twitter-integration') }}</ui-switch>
			<ui-horizon-group>
				<ui-input v-model="twitterConsumerKey" :disabled="!enableTwitterIntegration"><template #icon><fa icon="key"/></template>{{ $t('twitter-integration-consumer-key') }}</ui-input>
				<ui-input v-model="twitterConsumerSecret" :disabled="!enableTwitterIntegration"><template #icon><fa icon="key"/></template>{{ $t('twitter-integration-consumer-secret') }}</ui-input>
			</ui-horizon-group>
			<ui-info>{{ $t('twitter-integration-info', { url: `${url}/api/tw/cb` }) }}</ui-info>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="['fab', 'github']"/> {{ $t('github-integration-config') }}</template>
		<section>
			<ui-switch v-model="enableGithubIntegration">{{ $t('enable-github-integration') }}</ui-switch>
			<ui-horizon-group>
				<ui-input v-model="githubClientId" :disabled="!enableGithubIntegration"><template #icon><fa icon="key"/></template>{{ $t('github-integration-client-id') }}</ui-input>
				<ui-input v-model="githubClientSecret" :disabled="!enableGithubIntegration"><template #icon><fa icon="key"/></template>{{ $t('github-integration-client-secret') }}</ui-input>
			</ui-horizon-group>
			<ui-info>{{ $t('github-integration-info', { url: `${url}/api/gh/cb` }) }}</ui-info>
			<ui-button @click="updateMeta">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="['fab', 'discord']"/> {{ $t('discord-integration-config') }}</template>
		<section>
			<ui-switch v-model="enableDiscordIntegration">{{ $t('enable-discord-integration') }}</ui-switch>
			<ui-horizon-group>
				<ui-input v-model="discordClientId" :disabled="!enableDiscordIntegration"><template #icon><fa icon="key"/></template>{{ $t('discord-integration-client-id') }}</ui-input>
				<ui-input v-model="discordClientSecret" :disabled="!enableDiscordIntegration"><template #icon><fa icon="key"/></template>{{ $t('discord-integration-client-secret') }}</ui-input>
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
			smtpAuth: false,
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
			this.smtpAuth = meta.smtpUser != null && meta.smtpUser !== '';
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
				smtpUser: this.smtpAuth ? this.smtpUser : '',
				smtpPass: this.smtpAuth ? this.smtpPass : '',
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

<template>
<div>
	<ui-card>
		<template #title><fa icon="cog"/> {{ $t('instance') }}</template>
		<section class="fit-top">
			<ui-input :value="host" readonly>{{ $t('host') }}</ui-input>
			<ui-input v-model="name">{{ $t('instance-name') }}</ui-input>
			<ui-textarea v-model="description">{{ $t('instance-description') }}</ui-textarea>
			<ui-input v-model="iconUrl"><template #icon><fa icon="link"/></template>{{ $t('icon-url') }}</ui-input>
			<ui-input v-model="mascotImageUrl"><template #icon><fa icon="link"/></template>{{ $t('logo-url') }}</ui-input>
			<ui-input v-model="bannerUrl"><template #icon><fa icon="link"/></template>{{ $t('banner-url') }}</ui-input>
			<ui-input v-model="ToSUrl"><template #icon><fa icon="link"/></template>{{ $t('tos-url') }}</ui-input>
			<details>
				<summary>{{ $t('advanced-config') }}</summary>
				<ui-input v-model="errorImageUrl"><template #icon><fa icon="link"/></template>{{ $t('error-image-url') }}</ui-input>
				<ui-input v-model="languages"><template #icon><fa icon="language"/></template>{{ $t('languages') }}<template #desc>{{ $t('languages-desc') }}</template></ui-input>
				<ui-input v-model="repositoryUrl"><template #icon><fa icon="link"/></template>{{ $t('repository-url') }}</ui-input>
				<ui-input v-model="feedbackUrl"><template #icon><fa icon="link"/></template>{{ $t('feedback-url') }}</ui-input>
			</details>
		</section>
		<section class="fit-bottom">
			<header><fa :icon="faHeadset"/> {{ $t('maintainer-config') }}</header>
			<ui-input v-model="maintainerName">{{ $t('maintainer-name') }}</ui-input>
			<ui-input v-model="maintainerEmail" type="email"><template #icon><fa :icon="farEnvelope"/></template>{{ $t('maintainer-email') }}</ui-input>
		</section>
		<section>
			<ui-switch v-model="disableRegistration">{{ $t('disable-registration') }}</ui-switch>
			<ui-button v-if="disableRegistration" @click="invite">{{ $t('invite') }}</ui-button>
		</section>
		<section>
			<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faPencilAlt"/> {{ $t('note-and-tl') }}</template>
		<section class="fit-top fit-bottom">
			<ui-input v-model="maxNoteTextLength">{{ $t('max-note-text-length') }}</ui-input>
		</section>
		<section>
			<ui-switch v-model="disableLocalTimeline">{{ $t('disable-local-timeline') }}</ui-switch>
			<ui-switch v-model="disableGlobalTimeline">{{ $t('disable-global-timeline') }}</ui-switch>
			<ui-info>{{ $t('disabling-timelines-info') }}</ui-info>
		</section>
		<section>
			<ui-switch v-model="enableEmojiReaction">{{ $t('enable-emoji-reaction') }}</ui-switch>
			<ui-switch v-model="useStarForReactionFallback">{{ $t('use-star-for-reaction-fallback') }}</ui-switch>
		</section>
		<section>
			<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa icon="cloud"/> {{ $t('drive-config') }}</template>
		<section>
			<ui-switch v-model="useObjectStorage">{{ $t('use-object-storage') }}</ui-switch>
			<template v-if="useObjectStorage">
				<ui-info>
					<i18n path="object-storage-s3-info">
						<a href="https://docs.aws.amazon.com/general/latest/gr/rande.html" target="_blank">{{ $t('object-storage-s3-info-here') }}</a>
					</i18n>
				</ui-info>
				<ui-info>{{ $t('object-storage-gcs-info') }}</ui-info>
				<ui-input v-model="objectStorageBaseUrl" :disabled="!useObjectStorage">{{ $t('object-storage-base-url') }}</ui-input>
				<ui-horizon-group inputs>
					<ui-input v-model="objectStorageBucket" :disabled="!useObjectStorage">{{ $t('object-storage-bucket') }}</ui-input>
					<ui-input v-model="objectStoragePrefix" :disabled="!useObjectStorage">{{ $t('object-storage-prefix') }}</ui-input>
				</ui-horizon-group>
				<ui-input v-model="objectStorageEndpoint" :disabled="!useObjectStorage">{{ $t('object-storage-endpoint') }}</ui-input>
				<ui-horizon-group inputs>
					<ui-input v-model="objectStorageRegion" :disabled="!useObjectStorage">{{ $t('object-storage-region') }}</ui-input>
					<ui-input v-model="objectStoragePort" type="number" :disabled="!useObjectStorage">{{ $t('object-storage-port') }}</ui-input>
				</ui-horizon-group>
				<ui-horizon-group inputs>
					<ui-input v-model="objectStorageAccessKey" :disabled="!useObjectStorage"><template #icon><fa icon="key"/></template>{{ $t('object-storage-access-key') }}</ui-input>
					<ui-input v-model="objectStorageSecretKey" :disabled="!useObjectStorage"><template #icon><fa icon="key"/></template>{{ $t('object-storage-secret-key') }}</ui-input>
				</ui-horizon-group>
				<ui-switch v-model="objectStorageUseSSL" :disabled="!useObjectStorage">{{ $t('object-storage-use-ssl') }}</ui-switch>
			</template>
		</section>
		<section>
			<ui-switch v-model="cacheRemoteFiles">{{ $t('cache-remote-files') }}<template #desc>{{ $t('cache-remote-files-desc') }}</template></ui-switch>
		</section>
		<section class="fit-top fit-bottom">
			<ui-input v-model="localDriveCapacityMb" type="number">{{ $t('local-drive-capacity-mb') }}<template #suffix>MB</template><template #desc>{{ $t('mb') }}</template></ui-input>
			<ui-input v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles">{{ $t('remote-drive-capacity-mb') }}<template #suffix>MB</template><template #desc>{{ $t('mb') }}</template></ui-input>
		</section>
		<section>
			<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faThumbtack"/> {{ $t('pinned-users') }}</template>
		<section class="fit-top">
			<ui-textarea v-model="pinnedUsers">
				<template #desc>{{ $t('pinned-users-info') }}</template>
			</ui-textarea>
			<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faGhost"/> {{ $t('proxy-account-config') }}</template>
		<section>
			<ui-info>{{ $t('proxy-account-info') }}</ui-info>
			<ui-input v-model="proxyAccount"><template #prefix>@</template>{{ $t('proxy-account-username') }}<template #desc>{{ $t('proxy-account-username-desc') }}</template></ui-input>
			<ui-info warn>{{ $t('proxy-account-warn') }}</ui-info>
		</section>
		<section>
			<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="farEnvelope"/> {{ $t('email-config') }}</template>
		<section>
			<ui-switch v-model="enableEmail">{{ $t('enable-email') }}<template #desc>{{ $t('email-config-info') }}</template></ui-switch>
			<template v-if="enableEmail">
				<ui-input v-model="email" type="email" :disabled="!enableEmail">{{ $t('email') }}</ui-input>
				<ui-horizon-group inputs>
					<ui-input v-model="smtpHost" :disabled="!enableEmail">{{ $t('smtp-host') }}</ui-input>
					<ui-input v-model="smtpPort" type="number" :disabled="!enableEmail">{{ $t('smtp-port') }}</ui-input>
				</ui-horizon-group>
				<ui-switch v-model="smtpAuth">{{ $t('smtp-auth') }}</ui-switch>
				<ui-horizon-group inputs>
					<ui-input v-model="smtpUser" :disabled="!enableEmail || !smtpAuth">{{ $t('smtp-user') }}</ui-input>
					<ui-input v-model="smtpPass" type="password" :with-password-toggle="true" :disabled="!enableEmail || !smtpAuth">{{ $t('smtp-pass') }}</ui-input>
				</ui-horizon-group>
				<ui-switch v-model="smtpSecure" :disabled="!enableEmail">{{ $t('smtp-secure') }}<template #desc>{{ $t('smtp-secure-info') }}</template></ui-switch>
				<ui-button @click="testEmail()">{{ $t('test-email') }}</ui-button>
			</template>
		</section>
		<section>
			<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faBolt"/> {{ $t('serviceworker-config') }}</template>
		<section>
			<ui-switch v-model="enableServiceWorker">{{ $t('enable-serviceworker') }}<template #desc>{{ $t('serviceworker-info') }}</template></ui-switch>
			<template v-if="enableServiceWorker">
				<ui-info>{{ $t('vapid-info') }}<br><code>npm i web-push -g<br>web-push generate-vapid-keys</code></ui-info>
				<ui-horizon-group inputs class="fit-bottom">
					<ui-input v-model="swPublicKey" :disabled="!enableServiceWorker"><template #icon><fa icon="key"/></template>{{ $t('vapid-publickey') }}</ui-input>
					<ui-input v-model="swPrivateKey" :disabled="!enableServiceWorker"><template #icon><fa icon="key"/></template>{{ $t('vapid-privatekey') }}</ui-input>
				</ui-horizon-group>
			</template>
		</section>
		<section>
			<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faShieldAlt"/> {{ $t('recaptcha-config') }}</template>
		<section :class="enableRecaptcha ? 'fit-bottom' : ''">
			<ui-switch v-model="enableRecaptcha">{{ $t('enable-recaptcha') }}</ui-switch>
			<template v-if="enableRecaptcha">
				<ui-info>{{ $t('recaptcha-info') }}</ui-info>
				<ui-info warn>{{ $t('recaptcha-info2') }}</ui-info>
				<ui-horizon-group inputs>
					<ui-input v-model="recaptchaSiteKey" :disabled="!enableRecaptcha"><template #icon><fa icon="key"/></template>{{ $t('recaptcha-site-key') }}</ui-input>
					<ui-input v-model="recaptchaSecretKey" :disabled="!enableRecaptcha"><template #icon><fa icon="key"/></template>{{ $t('recaptcha-secret-key') }}</ui-input>
				</ui-horizon-group>
			</template>
		</section>
		<section v-if="enableRecaptcha && recaptchaSiteKey">
			<header>{{ $t('recaptcha-preview') }}</header>
			<div ref="recaptcha" style="margin: 16px 0 0 0;" :key="recaptchaSiteKey"></div>
		</section>
		<section>
			<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faShieldAlt"/> {{ $t('external-service-integration-config') }}</template>
		<section>
			<header><fa :icon="['fab', 'twitter']"/> {{ $t('twitter-integration-config') }}</header>
			<ui-switch v-model="enableTwitterIntegration">{{ $t('enable-twitter-integration') }}</ui-switch>
			<template v-if="enableTwitterIntegration">
				<ui-horizon-group>
					<ui-input v-model="twitterConsumerKey" :disabled="!enableTwitterIntegration"><template #icon><fa icon="key"/></template>{{ $t('twitter-integration-consumer-key') }}</ui-input>
					<ui-input v-model="twitterConsumerSecret" :disabled="!enableTwitterIntegration"><template #icon><fa icon="key"/></template>{{ $t('twitter-integration-consumer-secret') }}</ui-input>
				</ui-horizon-group>
				<ui-info>{{ $t('twitter-integration-info', { url: `${url}/api/tw/cb` }) }}</ui-info>
			</template>
		</section>
		<section>
			<header><fa :icon="['fab', 'github']"/> {{ $t('github-integration-config') }}</header>
			<ui-switch v-model="enableGithubIntegration">{{ $t('enable-github-integration') }}</ui-switch>
			<template v-if="enableGithubIntegration">
				<ui-horizon-group>
					<ui-input v-model="githubClientId" :disabled="!enableGithubIntegration"><template #icon><fa icon="key"/></template>{{ $t('github-integration-client-id') }}</ui-input>
					<ui-input v-model="githubClientSecret" :disabled="!enableGithubIntegration"><template #icon><fa icon="key"/></template>{{ $t('github-integration-client-secret') }}</ui-input>
				</ui-horizon-group>
				<ui-info>{{ $t('github-integration-info', { url: `${url}/api/gh/cb` }) }}</ui-info>
			</template>
		</section>
		<section>
			<header><fa :icon="['fab', 'discord']"/> {{ $t('discord-integration-config') }}</header>
			<ui-switch v-model="enableDiscordIntegration">{{ $t('enable-discord-integration') }}</ui-switch>
			<template v-if="enableDiscordIntegration">
				<ui-horizon-group>
					<ui-input v-model="discordClientId" :disabled="!enableDiscordIntegration"><template #icon><fa icon="key"/></template>{{ $t('discord-integration-client-id') }}</ui-input>
					<ui-input v-model="discordClientSecret" :disabled="!enableDiscordIntegration"><template #icon><fa icon="key"/></template>{{ $t('discord-integration-client-secret') }}</ui-input>
				</ui-horizon-group>
				<ui-info>{{ $t('discord-integration-info', { url: `${url}/api/dc/cb` }) }}</ui-info>
			</template>
		</section>
		<section>
			<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
		</section>
	</ui-card>

	<details>
		<summary style="color:var(--text);">{{ $t('advanced-config') }}</summary>

		<ui-card>
			<template #title><fa :icon="faHashtag"/> {{ $t('hidden-tags') }}</template>
			<section class="fit-top">
				<ui-textarea v-model="hiddenTags">
					<template #desc>{{ $t('hidden-tags-info') }}</template>
				</ui-textarea>
				<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
			</section>
		</ui-card>

		<ui-card>
			<template #title>summaly Proxy</template>
			<section class="fit-top fit-bottom">
				<ui-input v-model="summalyProxy">URL</ui-input>
			</section>
			<section>
				<ui-button @click="updateMeta"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
			</section>
		</ui-card>
	</details>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { url, host } from '../../config';
import { toUnicode } from 'punycode';
import { faHeadset, faShieldAlt, faGhost, faUserPlus, faBolt, faThumbtack, faPencilAlt, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope as farEnvelope, faSave } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/instance.vue'),

	data() {
		return {
			url,
			host: toUnicode(host),
			maintainerName: null,
			maintainerEmail: null,
			ToSUrl: null,
			repositoryUrl: "https://github.com/syuilo/misskey",
			feedbackUrl: null,
			disableRegistration: false,
			disableLocalTimeline: false,
			disableGlobalTimeline: false,
			enableEmojiReaction: true,
			useStarForReactionFallback: false,
			mascotImageUrl: null,
			bannerUrl: null,
			errorImageUrl: null,
			iconUrl: null,
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
			pinnedUsers: '',
			hiddenTags: '',
			useObjectStorage: false,
			objectStorageBaseUrl: null,
			objectStorageBucket: null,
			objectStoragePrefix: null,
			objectStorageEndpoint: null,
			objectStorageRegion: null,
			objectStoragePort: null,
			objectStorageAccessKey: null,
			objectStorageSecretKey: null,
			objectStorageUseSSL: false,
			faHeadset, faShieldAlt, faGhost, faUserPlus, farEnvelope, faBolt, faThumbtack, faPencilAlt, faSave, faHashtag
		};
	},

	created() {
		this.$root.getMeta(true).then(meta => {
			this.maintainerName = meta.maintainerName;
			this.maintainerEmail = meta.maintainerEmail;
			this.ToSUrl = meta.ToSUrl;
			this.repositoryUrl = meta.repositoryUrl;
			this.feedbackUrl = meta.feedbackUrl;
			this.disableRegistration = meta.disableRegistration;
			this.disableLocalTimeline = meta.disableLocalTimeline;
			this.disableGlobalTimeline = meta.disableGlobalTimeline;
			this.enableEmojiReaction = meta.enableEmojiReaction;
			this.useStarForReactionFallback = meta.useStarForReactionFallback;
			this.mascotImageUrl = meta.mascotImageUrl;
			this.bannerUrl = meta.bannerUrl;
			this.errorImageUrl = meta.errorImageUrl;
			this.iconUrl = meta.iconUrl;
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
			this.pinnedUsers = meta.pinnedUsers.join('\n');
			this.hiddenTags = meta.hiddenTags.join('\n');
			this.useObjectStorage = meta.useObjectStorage;
			this.objectStorageBaseUrl = meta.objectStorageBaseUrl;
			this.objectStorageBucket = meta.objectStorageBucket;
			this.objectStoragePrefix = meta.objectStoragePrefix;
			this.objectStorageEndpoint = meta.objectStorageEndpoint;
			this.objectStorageRegion = meta.objectStorageRegion;
			this.objectStoragePort = meta.objectStoragePort;
			this.objectStorageAccessKey = meta.objectStorageAccessKey;
			this.objectStorageSecretKey = meta.objectStorageSecretKey;
			this.objectStorageUseSSL = meta.objectStorageUseSSL;
		});
	},

	mounted() {
		const renderRecaptchaPreview = () => {
			if (!(window as any).grecaptcha) return;
			if (!this.$refs.recaptcha) return;
			if (!this.recaptchaSiteKey) return;
			(window as any).grecaptcha.render(this.$refs.recaptcha, {
				sitekey: this.recaptchaSiteKey
			});
		};

		window.onRecaotchaLoad = () => {
			renderRecaptchaPreview();
		};

		const head = document.getElementsByTagName('head')[0];
		const script = document.createElement('script');
		script.setAttribute('src', 'https://www.google.com/recaptcha/api.js?onload=onRecaotchaLoad');
		head.appendChild(script);

		this.$watch('enableRecaptcha', () => {
			renderRecaptchaPreview();
		});

		this.$watch('recaptchaSiteKey', () => {
			renderRecaptchaPreview();
		});
	},

	methods: {
		invite() {
			this.$root.api('admin/invite').then(x => {
				this.$root.dialog({
					type: 'info',
					text: x.code
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
		},

		async testEmail() {
			this.$root.api('admin/send-email', {
				to: this.maintainerEmail,
				subject: 'Test email',
				text: 'Yo'
			}).then(x => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
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
				ToSUrl: this.ToSUrl,
				repositoryUrl: this.repositoryUrl,
				feedbackUrl: this.feedbackUrl,
				disableRegistration: this.disableRegistration,
				disableLocalTimeline: this.disableLocalTimeline,
				disableGlobalTimeline: this.disableGlobalTimeline,
				enableEmojiReaction: this.enableEmojiReaction,
				useStarForReactionFallback: this.useStarForReactionFallback,
				mascotImageUrl: this.mascotImageUrl,
				bannerUrl: this.bannerUrl,
				errorImageUrl: this.errorImageUrl,
				iconUrl: this.iconUrl,
				name: this.name,
				description: this.description,
				langs: this.languages ? this.languages.split(' ') : [],
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
				swPrivateKey: this.swPrivateKey,
				pinnedUsers: this.pinnedUsers ? this.pinnedUsers.split('\n') : [],
				hiddenTags: this.hiddenTags ? this.hiddenTags.split('\n') : [],
				useObjectStorage: this.useObjectStorage,
				objectStorageBaseUrl: this.objectStorageBaseUrl ? this.objectStorageBaseUrl : null,
				objectStorageBucket: this.objectStorageBucket ? this.objectStorageBucket : null,
				objectStoragePrefix: this.objectStoragePrefix ? this.objectStoragePrefix : null,
				objectStorageEndpoint: this.objectStorageEndpoint ? this.objectStorageEndpoint : null,
				objectStorageRegion: this.objectStorageRegion ? this.objectStorageRegion : null,
				objectStoragePort: this.objectStoragePort ? this.objectStoragePort : null,
				objectStorageAccessKey: this.objectStorageAccessKey ? this.objectStorageAccessKey : null,
				objectStorageSecretKey: this.objectStorageSecretKey ? this.objectStorageSecretKey : null,
				objectStorageUseSSL: this.objectStorageUseSSL,
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

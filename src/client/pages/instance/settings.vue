<template>
<div v-if="meta" class="_section">
	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faInfoCircle"/> {{ $t('basicInfo') }}</div>
		<div class="_content">
			<MkInput v-model:value="name">{{ $t('instanceName') }}</MkInput>
			<MkTextarea v-model:value="description">{{ $t('instanceDescription') }}</MkTextarea>
			<MkInput v-model:value="iconUrl"><template #icon><Fa :icon="faLink"/></template>{{ $t('iconUrl') }}</MkInput>
			<MkInput v-model:value="bannerUrl"><template #icon><Fa :icon="faLink"/></template>{{ $t('bannerUrl') }}</MkInput>
			<MkInput v-model:value="backgroundImageUrl"><template #icon><Fa :icon="faLink"/></template>{{ $t('backgroundImageUrl') }}</MkInput>
			<MkInput v-model:value="logoImageUrl"><template #icon><Fa :icon="faLink"/></template>{{ $t('logoImageUrl') }}</MkInput>
			<MkInput v-model:value="tosUrl"><template #icon><Fa :icon="faLink"/></template>{{ $t('tosUrl') }}</MkInput>
			<MkInput v-model:value="maintainerName">{{ $t('maintainerName') }}</MkInput>
			<MkInput v-model:value="maintainerEmail" type="email"><template #icon><Fa :icon="faEnvelope"/></template>{{ $t('maintainerEmail') }}</MkInput>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<MkInput v-model:value="pinnedClipId">{{ $t('pinnedClipId') }}</MkInput>

	<section class="_card _vMargin">
		<div class="_content">
			<MkInput v-model:value="maxNoteTextLength" type="number" :save="() => save()"><template #icon><Fa :icon="faPencilAlt"/></template>{{ $t('maxNoteTextLength') }}</MkInput>
		</div>
		<div class="_content">
			<MkSwitch v-model:value="enableLocalTimeline" @update:value="save()">{{ $t('enableLocalTimeline') }}</MkSwitch>
			<MkSwitch v-model:value="enableGlobalTimeline" @update:value="save()">{{ $t('enableGlobalTimeline') }}</MkSwitch>
			<MkInfo>{{ $t('disablingTimelinesInfo') }}</MkInfo>
		</div>
		<div class="_content">
			<MkSwitch v-model:value="useStarForReactionFallback" @update:value="save()">{{ $t('useStarForReactionFallback') }}</MkSwitch>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faUser"/> {{ $t('registration') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableRegistration" @update:value="save()">{{ $t('enableRegistration') }}</MkSwitch>
			<MkButton v-if="!enableRegistration" @click="invite">{{ $t('invite') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faShieldAlt"/> {{ $t('hcaptcha') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableHcaptcha">{{ $t('enableHcaptcha') }}</MkSwitch>
			<template v-if="enableHcaptcha">
				<MkInput v-model:value="hcaptchaSiteKey" :disabled="!enableHcaptcha"><template #icon><Fa :icon="faKey"/></template>{{ $t('hcaptchaSiteKey') }}</MkInput>
				<MkInput v-model:value="hcaptchaSecretKey" :disabled="!enableHcaptcha"><template #icon><Fa :icon="faKey"/></template>{{ $t('hcaptchaSecretKey') }}</MkInput>
			</template>
		</div>
		<div class="_content" v-if="enableHcaptcha">
			<header>{{ $t('preview') }}</header>
			<captcha v-if="enableHcaptcha" provider="hcaptcha" :sitekey="hcaptchaSiteKey || '10000000-ffff-ffff-ffff-000000000001'"/>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faShieldAlt"/> {{ $t('recaptcha') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableRecaptcha" ref="enableRecaptcha">{{ $t('enableRecaptcha') }}</MkSwitch>
			<template v-if="enableRecaptcha">
				<MkInput v-model:value="recaptchaSiteKey" :disabled="!enableRecaptcha"><template #icon><Fa :icon="faKey"/></template>{{ $t('recaptchaSiteKey') }}</MkInput>
				<MkInput v-model:value="recaptchaSecretKey" :disabled="!enableRecaptcha"><template #icon><Fa :icon="faKey"/></template>{{ $t('recaptchaSecretKey') }}</MkInput>
			</template>
		</div>
		<div class="_content" v-if="enableRecaptcha && recaptchaSiteKey">
			<header>{{ $t('preview') }}</header>
			<captcha v-if="enableRecaptcha" provider="grecaptcha" :sitekey="recaptchaSiteKey"/>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faEnvelope" /> {{ $t('emailConfig') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableEmail" @update:value="save()">{{ $t('enableEmail') }}<template #desc>{{ $t('emailConfigInfo') }}</template></MkSwitch>
			<MkInput v-model:value="email" type="email" :disabled="!enableEmail">{{ $t('email') }}</MkInput>
			<div><b>{{ $t('smtpConfig') }}</b></div>
			<div class="_inputs">
				<MkInput v-model:value="smtpHost" :disabled="!enableEmail">{{ $t('smtpHost') }}</MkInput>
				<MkInput v-model:value="smtpPort" type="number" :disabled="!enableEmail">{{ $t('smtpPort') }}</MkInput>
			</div>
			<div class="_inputs">
				<MkInput v-model:value="smtpUser" :disabled="!enableEmail">{{ $t('smtpUser') }}</MkInput>
				<MkInput v-model:value="smtpPass" type="password" :disabled="!enableEmail">{{ $t('smtpPass') }}</MkInput>
			</div>
			<MkInfo>{{ $t('emptyToDisableSmtpAuth') }}</MkInfo>
			<MkSwitch v-model:value="smtpSecure" :disabled="!enableEmail">{{ $t('smtpSecure') }}<template #desc>{{ $t('smtpSecureInfo') }}</template></MkSwitch>
			<div>
			  <MkButton :disabled="!enableEmail" primary inline @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
				<MkButton :disabled="!enableEmail" inline @click="testEmail()">{{ $t('testEmail') }}</MkButton>
			</div>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faBolt"/> {{ $t('serviceworker') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableServiceWorker">{{ $t('enableServiceworker') }}<template #desc>{{ $t('serviceworkerInfo') }}</template></MkSwitch>
			<template v-if="enableServiceWorker">
				<div class="_inputs">
					<MkInput v-model:value="swPublicKey" :disabled="!enableServiceWorker"><template #icon><Fa :icon="faKey"/></template>Public key</MkInput>
					<MkInput v-model:value="swPrivateKey" :disabled="!enableServiceWorker"><template #icon><Fa :icon="faKey"/></template>Private key</MkInput>
				</div>
			</template>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faThumbtack"/> {{ $t('pinnedUsers') }}</div>
		<div class="_content">
			<MkTextarea v-model:value="pinnedUsers">
				<template #desc>{{ $t('pinnedUsersDescription') }} <button class="_textButton" @click="addPinUser">{{ $t('addUser') }}</button></template>
			</MkTextarea>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faThumbtack"/> {{ $t('pinnedPages') }}</div>
		<div class="_content">
			<MkTextarea v-model:value="pinnedPages">
				<template #desc>{{ $t('pinnedPagesDescription') }}</template>
			</MkTextarea>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faCloud"/> {{ $t('files') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="cacheRemoteFiles">{{ $t('cacheRemoteFiles') }}<template #desc>{{ $t('cacheRemoteFilesDescription') }}</template></MkSwitch>
			<MkSwitch v-model:value="proxyRemoteFiles">{{ $t('proxyRemoteFiles') }}<template #desc>{{ $t('proxyRemoteFilesDescription') }}</template></MkSwitch>
			<MkInput v-model:value="localDriveCapacityMb" type="number">{{ $t('driveCapacityPerLocalAccount') }}<template #suffix>MB</template><template #desc>{{ $t('inMb') }}</template></MkInput>
			<MkInput v-model:value="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles">{{ $t('driveCapacityPerRemoteAccount') }}<template #suffix>MB</template><template #desc>{{ $t('inMb') }}</template></MkInput>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faCloud"/> {{ $t('objectStorage') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="useObjectStorage">{{ $t('useObjectStorage') }}</MkSwitch>
			<template v-if="useObjectStorage">
				<MkInput v-model:value="objectStorageBaseUrl" :disabled="!useObjectStorage">{{ $t('objectStorageBaseUrl') }}<template #desc>{{ $t('objectStorageBaseUrlDesc') }}</template></MkInput>
				<div class="_inputs">
					<MkInput v-model:value="objectStorageBucket" :disabled="!useObjectStorage">{{ $t('objectStorageBucket') }}<template #desc>{{ $t('objectStorageBucketDesc') }}</template></MkInput>
					<MkInput v-model:value="objectStoragePrefix" :disabled="!useObjectStorage">{{ $t('objectStoragePrefix') }}<template #desc>{{ $t('objectStoragePrefixDesc') }}</template></MkInput>
				</div>
				<MkInput v-model:value="objectStorageEndpoint" :disabled="!useObjectStorage">{{ $t('objectStorageEndpoint') }}<template #desc>{{ $t('objectStorageEndpointDesc') }}</template></MkInput>
				<div class="_inputs">
					<MkInput v-model:value="objectStorageRegion" :disabled="!useObjectStorage">{{ $t('objectStorageRegion') }}<template #desc>{{ $t('objectStorageRegionDesc') }}</template></MkInput>
				</div>
				<div class="_inputs">
					<MkInput v-model:value="objectStorageAccessKey" :disabled="!useObjectStorage"><template #icon><Fa :icon="faKey"/></template>Access key</MkInput>
					<MkInput v-model:value="objectStorageSecretKey" :disabled="!useObjectStorage"><template #icon><Fa :icon="faKey"/></template>Secret key</MkInput>
				</div>
				<MkSwitch v-model:value="objectStorageUseSSL" :disabled="!useObjectStorage">{{ $t('objectStorageUseSSL') }}<template #desc>{{ $t('objectStorageUseSSLDesc') }}</template></MkSwitch>
				<MkSwitch v-model:value="objectStorageUseProxy" :disabled="!useObjectStorage">{{ $t('objectStorageUseProxy') }}<template #desc>{{ $t('objectStorageUseProxyDesc') }}</template></MkSwitch>
				<MkSwitch v-model:value="objectStorageSetPublicRead" :disabled="!useObjectStorage">{{ $t('objectStorageSetPublicRead') }}</MkSwitch>
			</template>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faGhost"/> {{ $t('proxyAccount') }}</div>
		<div class="_content">
			<MkInput :value="proxyAccount ? proxyAccount.username : null" disabled><template #prefix>@</template>{{ $t('proxyAccount') }}<template #desc>{{ $t('proxyAccountDescription') }}</template></MkInput>
			<MkButton primary @click="chooseProxyAccount">{{ $t('chooseProxyAccount') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faBan"/> {{ $t('blockedInstances') }}</div>
		<div class="_content">
			<MkTextarea v-model:value="blockedHosts">
				<template #desc>{{ $t('blockedInstancesDescription') }}</template>
			</MkTextarea>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faShareAlt"/> {{ $t('integration') }}</div>
		<div class="_content">
			<header><Fa :icon="faTwitter"/> Twitter</header>
			<MkSwitch v-model:value="enableTwitterIntegration">{{ $t('enable') }}</MkSwitch>
			<template v-if="enableTwitterIntegration">
				<MkInfo>Callback URL: {{ `${url}/api/tw/cb` }}</MkInfo>
				<MkInput v-model:value="twitterConsumerKey" :disabled="!enableTwitterIntegration"><template #icon><Fa :icon="faKey"/></template>Consumer Key</MkInput>
				<MkInput v-model:value="twitterConsumerSecret" :disabled="!enableTwitterIntegration"><template #icon><Fa :icon="faKey"/></template>Consumer Secret</MkInput>
			</template>
		</div>
		<div class="_content">
			<header><Fa :icon="faGithub"/> GitHub</header>
			<MkSwitch v-model:value="enableGithubIntegration">{{ $t('enable') }}</MkSwitch>
			<template v-if="enableGithubIntegration">
				<MkInfo>Callback URL: {{ `${url}/api/gh/cb` }}</MkInfo>
				<MkInput v-model:value="githubClientId" :disabled="!enableGithubIntegration"><template #icon><Fa :icon="faKey"/></template>Client ID</MkInput>
				<MkInput v-model:value="githubClientSecret" :disabled="!enableGithubIntegration"><template #icon><Fa :icon="faKey"/></template>Client Secret</MkInput>
			</template>
		</div>
		<div class="_content">
			<header><Fa :icon="faDiscord"/> Discord</header>
			<MkSwitch v-model:value="enableDiscordIntegration">{{ $t('enable') }}</MkSwitch>
			<template v-if="enableDiscordIntegration">
				<MkInfo>Callback URL: {{ `${url}/api/dc/cb` }}</MkInfo>
				<MkInput v-model:value="discordClientId" :disabled="!enableDiscordIntegration"><template #icon><Fa :icon="faKey"/></template>Client ID</MkInput>
				<MkInput v-model:value="discordClientSecret" :disabled="!enableDiscordIntegration"><template #icon><Fa :icon="faKey"/></template>Client Secret</MkInput>
			</template>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faArchway" /> Summaly Proxy</div>
		<div class="_content">
			<MkInput v-model:value="summalyProxy">URL</MkInput>
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { faPencilAlt, faShareAlt, faGhost, faCog, faPlus, faCloud, faInfoCircle, faBan, faSave, faServer, faLink, faThumbtack, faUser, faShieldAlt, faKey, faBolt, faArchway } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkInfo from '@/components/ui/info.vue';
import { url } from '@/config';
import getAcct from '../../../misc/acct/render';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkTextarea,
		MkSwitch,
		MkInfo,
		Captcha: defineAsyncComponent(() => import('@/components/captcha.vue')),
	},

	data() {
		return {
			INFO: {
				title: this.$t('instance'),
				icon: faCog,
			},
			meta: null,
			url,
			proxyAccount: null,
			proxyAccountId: null,
			cacheRemoteFiles: false,
			proxyRemoteFiles: false,
			localDriveCapacityMb: 0,
			remoteDriveCapacityMb: 0,
			blockedHosts: '',
			pinnedUsers: '',
			pinnedPages: '',
			pinnedClipId: null,
			maintainerName: null,
			maintainerEmail: null,
			name: null,
			description: null,
			tosUrl: null as string | null,
			enableEmail: false,
			email: null,
			bannerUrl: null,
			iconUrl: null,
			logoImageUrl: null,
			backgroundImageUrl: null,
			maxNoteTextLength: 0,
			enableRegistration: false,
			enableLocalTimeline: false,
			enableGlobalTimeline: false,
			enableHcaptcha: false,
			hcaptchaSiteKey: null,
			hcaptchaSecretKey: null,
			enableRecaptcha: false,
			recaptchaSiteKey: null,
			recaptchaSecretKey: null,
			enableServiceWorker: false,
			swPublicKey: null,
			swPrivateKey: null,
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
			objectStorageUseProxy: false,
			objectStorageSetPublicRead: false,
			enableTwitterIntegration: false,
			twitterConsumerKey: null,
			twitterConsumerSecret: null,
			enableGithubIntegration: false,
			githubClientId: null,
			githubClientSecret: null,
			enableDiscordIntegration: false,
			discordClientId: null,
			discordClientSecret: null,
			useStarForReactionFallback: false,
			smtpSecure: false,
			smtpHost: '',
			smtpPort: 0,
			smtpUser: '',
			smtpPass: '',
			summalyProxy: '',
			faPencilAlt, faTwitter, faDiscord, faGithub, faShareAlt, faTrashAlt, faGhost, faCog, faPlus, faCloud, faInfoCircle, faBan, faSave, faServer, faLink, faEnvelope, faThumbtack, faUser, faShieldAlt, faKey, faBolt, faArchway
		}
	},

	async created() {
		this.meta = await os.api('meta', { detail: true });

		this.name = this.meta.name;
		this.description = this.meta.description;
		this.tosUrl = this.meta.tosUrl;
		this.bannerUrl = this.meta.bannerUrl;
		this.iconUrl = this.meta.iconUrl;
		this.logoImageUrl = this.meta.logoImageUrl;
		this.backgroundImageUrl = this.meta.backgroundImageUrl;
		this.enableEmail = this.meta.enableEmail;
		this.email = this.meta.email;
		this.maintainerName = this.meta.maintainerName;
		this.maintainerEmail = this.meta.maintainerEmail;
		this.maxNoteTextLength = this.meta.maxNoteTextLength;
		this.enableRegistration = !this.meta.disableRegistration;
		this.enableLocalTimeline = !this.meta.disableLocalTimeline;
		this.enableGlobalTimeline = !this.meta.disableGlobalTimeline;
		this.enableHcaptcha = this.meta.enableHcaptcha;
		this.hcaptchaSiteKey = this.meta.hcaptchaSiteKey;
		this.hcaptchaSecretKey = this.meta.hcaptchaSecretKey;
		this.enableRecaptcha = this.meta.enableRecaptcha;
		this.recaptchaSiteKey = this.meta.recaptchaSiteKey;
		this.recaptchaSecretKey = this.meta.recaptchaSecretKey;
		this.proxyAccountId = this.meta.proxyAccountId;
		this.cacheRemoteFiles = this.meta.cacheRemoteFiles;
		this.proxyRemoteFiles = this.meta.proxyRemoteFiles;
		this.localDriveCapacityMb = this.meta.driveCapacityPerLocalUserMb;
		this.remoteDriveCapacityMb = this.meta.driveCapacityPerRemoteUserMb;
		this.blockedHosts = this.meta.blockedHosts.join('\n');
		this.pinnedUsers = this.meta.pinnedUsers.join('\n');
		this.pinnedPages = this.meta.pinnedPages.join('\n');
		this.pinnedClipId = this.meta.pinnedClipId;
		this.enableServiceWorker = this.meta.enableServiceWorker;
		this.swPublicKey = this.meta.swPublickey;
		this.swPrivateKey = this.meta.swPrivateKey;
		this.useObjectStorage = this.meta.useObjectStorage;
		this.objectStorageBaseUrl = this.meta.objectStorageBaseUrl;
		this.objectStorageBucket = this.meta.objectStorageBucket;
		this.objectStoragePrefix = this.meta.objectStoragePrefix;
		this.objectStorageEndpoint = this.meta.objectStorageEndpoint;
		this.objectStorageRegion = this.meta.objectStorageRegion;
		this.objectStoragePort = this.meta.objectStoragePort;
		this.objectStorageAccessKey = this.meta.objectStorageAccessKey;
		this.objectStorageSecretKey = this.meta.objectStorageSecretKey;
		this.objectStorageUseSSL = this.meta.objectStorageUseSSL;
		this.objectStorageUseProxy = this.meta.objectStorageUseProxy;
		this.objectStorageSetPublicRead = this.meta.objectStorageSetPublicRead;
		this.enableTwitterIntegration = this.meta.enableTwitterIntegration;
		this.twitterConsumerKey = this.meta.twitterConsumerKey;
		this.twitterConsumerSecret = this.meta.twitterConsumerSecret;
		this.enableGithubIntegration = this.meta.enableGithubIntegration;
		this.githubClientId = this.meta.githubClientId;
		this.githubClientSecret = this.meta.githubClientSecret;
		this.enableDiscordIntegration = this.meta.enableDiscordIntegration;
		this.discordClientId = this.meta.discordClientId;
		this.discordClientSecret = this.meta.discordClientSecret;
		this.useStarForReactionFallback = this.meta.useStarForReactionFallback;
		this.smtpSecure = this.meta.smtpSecure;
		this.smtpHost = this.meta.smtpHost;
		this.smtpPort = this.meta.smtpPort;
		this.smtpUser = this.meta.smtpUser;
		this.smtpPass = this.meta.smtpPass;
		this.summalyProxy = this.meta.summalyProxy;

		if (this.proxyAccountId) {
			os.api('users/show', { userId: this.proxyAccountId }).then(proxyAccount => {
				this.proxyAccount = proxyAccount;
			});
		}
	},

	mounted() {
		this.$watch('enableHcaptcha', () => {
			if (this.enableHcaptcha && this.enableRecaptcha) {
				os.dialog({
					type: 'question', // warning だと間違って cancel するかもしれない
					showCancelButton: true,
					title: this.$t('settingGuide'),
					text: this.$t('avoidMultiCaptchaConfirm'),
				}).then(({ canceled }) => {
					if (canceled) {
						return;
					}

					this.enableRecaptcha = false;
				});
			}
		});

		this.$watch('enableRecaptcha', () => {
			if (this.enableRecaptcha && this.enableHcaptcha) {
				os.dialog({
					type: 'question', // warning だと間違って cancel するかもしれない
					showCancelButton: true,
					title: this.$t('settingGuide'),
					text: this.$t('avoidMultiCaptchaConfirm'),
				}).then(({ canceled }) => {
					if (canceled) {
						return;
					}

					this.enableHcaptcha = false;
				});
			}
		});
	},

	methods: {
		invite() {
			os.api('admin/invite').then(x => {
				os.dialog({
					type: 'info',
					text: x.code
				});
			}).catch(e => {
				os.dialog({
					type: 'error',
					text: e
				});
			});
		},

		addPinUser() {
			os.selectUser().then(user => {
				this.pinnedUsers = this.pinnedUsers.trim();
				this.pinnedUsers += '\n@' + getAcct(user);
				this.pinnedUsers = this.pinnedUsers.trim();
			});
		},

		chooseProxyAccount() {
			os.selectUser().then(user => {
				this.proxyAccount = user;
				this.proxyAccountId = user.id;
				this.save(true);
			});
		},

		async testEmail() {
			os.api('admin/send-email', {
				to: this.maintainerEmail,
				subject: 'Test email',
				text: 'Yo'
			}).then(x => {
				os.dialog({
					type: 'success',
					splash: true
				});
			}).catch(e => {
				os.dialog({
					type: 'error',
					text: e
				});
			});
		},

		save(withDialog = false) {
			os.api('admin/update-meta', {
				name: this.name,
				description: this.description,
				tosUrl: this.tosUrl,
				bannerUrl: this.bannerUrl,
				iconUrl: this.iconUrl,
				logoImageUrl: this.logoImageUrl,
				backgroundImageUrl: this.backgroundImageUrl,
				maintainerName: this.maintainerName,
				maintainerEmail: this.maintainerEmail,
				maxNoteTextLength: this.maxNoteTextLength,
				disableRegistration: !this.enableRegistration,
				disableLocalTimeline: !this.enableLocalTimeline,
				disableGlobalTimeline: !this.enableGlobalTimeline,
				enableHcaptcha: this.enableHcaptcha,
				hcaptchaSiteKey: this.hcaptchaSiteKey,
				hcaptchaSecretKey: this.hcaptchaSecretKey,
				enableRecaptcha: this.enableRecaptcha,
				recaptchaSiteKey: this.recaptchaSiteKey,
				recaptchaSecretKey: this.recaptchaSecretKey,
				proxyAccountId: this.proxyAccountId,
				cacheRemoteFiles: this.cacheRemoteFiles,
				proxyRemoteFiles: this.proxyRemoteFiles,
				localDriveCapacityMb: parseInt(this.localDriveCapacityMb, 10),
				remoteDriveCapacityMb: parseInt(this.remoteDriveCapacityMb, 10),
				blockedHosts: this.blockedHosts.split('\n') || [],
				pinnedUsers: this.pinnedUsers ? this.pinnedUsers.split('\n') : [],
				pinnedPages: this.pinnedPages ? this.pinnedPages.split('\n') : [],
				pinnedClipId: (this.pinnedClipId && this.pinnedClipId) != '' ? this.pinnedClipId : null,
				enableServiceWorker: this.enableServiceWorker,
				swPublicKey: this.swPublicKey,
				swPrivateKey: this.swPrivateKey,
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
				objectStorageUseProxy: this.objectStorageUseProxy,
				objectStorageSetPublicRead: this.objectStorageSetPublicRead,
				enableTwitterIntegration: this.enableTwitterIntegration,
				twitterConsumerKey: this.twitterConsumerKey,
				twitterConsumerSecret: this.twitterConsumerSecret,
				enableGithubIntegration: this.enableGithubIntegration,
				githubClientId: this.githubClientId,
				githubClientSecret: this.githubClientSecret,
				enableDiscordIntegration: this.enableDiscordIntegration,
				discordClientId: this.discordClientId,
				discordClientSecret: this.discordClientSecret,
				enableEmail: this.enableEmail,
				email: this.email,
				smtpSecure: this.smtpSecure,
				smtpHost: this.smtpHost,
				smtpPort: this.smtpPort,
				smtpUser: this.smtpUser,
				smtpPass: this.smtpPass,
				summalyProxy: this.summalyProxy,
				useStarForReactionFallback: this.useStarForReactionFallback,
			}).then(() => {
				this.$store.dispatch('instance/fetch');
				if (withDialog) {
					os.success();
				}
			}).catch(e => {
				os.dialog({
					type: 'error',
					text: e
				});
			});
		}
	}
});
</script>

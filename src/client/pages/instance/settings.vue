<template>
<div v-if="meta" class="_section">
	<section class="_card _gap">
		<div class="_title"><Fa :icon="faInfoCircle"/> {{ $ts.basicInfo }}</div>
		<div class="_content">
			<MkInput v-model:value="name">{{ $ts.instanceName }}</MkInput>
			<MkTextarea v-model:value="description">{{ $ts.instanceDescription }}</MkTextarea>
			<MkInput v-model:value="iconUrl"><template #icon><Fa :icon="faLink"/></template>{{ $ts.iconUrl }}</MkInput>
			<MkInput v-model:value="bannerUrl"><template #icon><Fa :icon="faLink"/></template>{{ $ts.bannerUrl }}</MkInput>
			<MkInput v-model:value="backgroundImageUrl"><template #icon><Fa :icon="faLink"/></template>{{ $ts.backgroundImageUrl }}</MkInput>
			<MkInput v-model:value="logoImageUrl"><template #icon><Fa :icon="faLink"/></template>{{ $ts.logoImageUrl }}</MkInput>
			<MkInput v-model:value="tosUrl"><template #icon><Fa :icon="faLink"/></template>{{ $ts.tosUrl }}</MkInput>
			<MkInput v-model:value="maintainerName">{{ $ts.maintainerName }}</MkInput>
			<MkInput v-model:value="maintainerEmail" type="email"><template #icon><Fa :icon="faEnvelope"/></template>{{ $ts.maintainerEmail }}</MkInput>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<MkInput v-model:value="pinnedClipId">{{ $ts.pinnedClipId }}</MkInput>

	<section class="_card _gap">
		<div class="_content">
			<MkInput v-model:value="maxNoteTextLength" type="number" :save="() => save()"><template #icon><Fa :icon="faPencilAlt"/></template>{{ $ts.maxNoteTextLength }}</MkInput>
		</div>
		<div class="_content">
			<MkSwitch v-model:value="enableLocalTimeline" @update:value="save()">{{ $ts.enableLocalTimeline }}</MkSwitch>
			<MkSwitch v-model:value="enableGlobalTimeline" @update:value="save()">{{ $ts.enableGlobalTimeline }}</MkSwitch>
			<MkInfo>{{ $ts.disablingTimelinesInfo }}</MkInfo>
		</div>
		<div class="_content">
			<MkSwitch v-model:value="useStarForReactionFallback" @update:value="save()">{{ $ts.useStarForReactionFallback }}</MkSwitch>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faUser"/> {{ $ts.registration }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableRegistration" @update:value="save()">{{ $ts.enableRegistration }}</MkSwitch>
			<MkButton v-if="!enableRegistration" @click="invite">{{ $ts.invite }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faShieldAlt"/> {{ $ts.hcaptcha }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableHcaptcha">{{ $ts.enableHcaptcha }}</MkSwitch>
			<template v-if="enableHcaptcha">
				<MkInput v-model:value="hcaptchaSiteKey" :disabled="!enableHcaptcha"><template #icon><Fa :icon="faKey"/></template>{{ $ts.hcaptchaSiteKey }}</MkInput>
				<MkInput v-model:value="hcaptchaSecretKey" :disabled="!enableHcaptcha"><template #icon><Fa :icon="faKey"/></template>{{ $ts.hcaptchaSecretKey }}</MkInput>
			</template>
		</div>
		<div class="_content" v-if="enableHcaptcha">
			<header>{{ $ts.preview }}</header>
			<captcha v-if="enableHcaptcha" provider="hcaptcha" :sitekey="hcaptchaSiteKey || '10000000-ffff-ffff-ffff-000000000001'"/>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faShieldAlt"/> {{ $ts.recaptcha }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableRecaptcha" ref="enableRecaptcha">{{ $ts.enableRecaptcha }}</MkSwitch>
			<template v-if="enableRecaptcha">
				<MkInput v-model:value="recaptchaSiteKey" :disabled="!enableRecaptcha"><template #icon><Fa :icon="faKey"/></template>{{ $ts.recaptchaSiteKey }}</MkInput>
				<MkInput v-model:value="recaptchaSecretKey" :disabled="!enableRecaptcha"><template #icon><Fa :icon="faKey"/></template>{{ $ts.recaptchaSecretKey }}</MkInput>
			</template>
		</div>
		<div class="_content" v-if="enableRecaptcha && recaptchaSiteKey">
			<header>{{ $ts.preview }}</header>
			<captcha v-if="enableRecaptcha" provider="grecaptcha" :sitekey="recaptchaSiteKey"/>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faEnvelope" /> {{ $ts.emailConfig }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableEmail" @update:value="save()">{{ $ts.enableEmail }}<template #desc>{{ $ts.emailConfigInfo }}</template></MkSwitch>
			<MkInput v-model:value="email" type="email" :disabled="!enableEmail">{{ $ts.email }}</MkInput>
			<div><b>{{ $ts.smtpConfig }}</b></div>
			<div class="_inputs">
				<MkInput v-model:value="smtpHost" :disabled="!enableEmail">{{ $ts.smtpHost }}</MkInput>
				<MkInput v-model:value="smtpPort" type="number" :disabled="!enableEmail">{{ $ts.smtpPort }}</MkInput>
			</div>
			<div class="_inputs">
				<MkInput v-model:value="smtpUser" :disabled="!enableEmail">{{ $ts.smtpUser }}</MkInput>
				<MkInput v-model:value="smtpPass" type="password" :disabled="!enableEmail">{{ $ts.smtpPass }}</MkInput>
			</div>
			<MkInfo>{{ $ts.emptyToDisableSmtpAuth }}</MkInfo>
			<MkSwitch v-model:value="smtpSecure" :disabled="!enableEmail">{{ $ts.smtpSecure }}<template #desc>{{ $ts.smtpSecureInfo }}</template></MkSwitch>
			<div>
			  <MkButton :disabled="!enableEmail" primary inline @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
				<MkButton :disabled="!enableEmail" inline @click="testEmail()">{{ $ts.testEmail }}</MkButton>
			</div>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faBolt"/> {{ $ts.serviceworker }}</div>
		<div class="_content">
			<MkSwitch v-model:value="enableServiceWorker">{{ $ts.enableServiceworker }}<template #desc>{{ $ts.serviceworkerInfo }}</template></MkSwitch>
			<template v-if="enableServiceWorker">
				<div class="_inputs">
					<MkInput v-model:value="swPublicKey" :disabled="!enableServiceWorker"><template #icon><Fa :icon="faKey"/></template>Public key</MkInput>
					<MkInput v-model:value="swPrivateKey" :disabled="!enableServiceWorker"><template #icon><Fa :icon="faKey"/></template>Private key</MkInput>
				</div>
			</template>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faThumbtack"/> {{ $ts.pinnedUsers }}</div>
		<div class="_content">
			<MkTextarea v-model:value="pinnedUsers">
				<template #desc>{{ $ts.pinnedUsersDescription }} <button class="_textButton" @click="addPinUser">{{ $ts.addUser }}</button></template>
			</MkTextarea>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faThumbtack"/> {{ $ts.pinnedPages }}</div>
		<div class="_content">
			<MkTextarea v-model:value="pinnedPages">
				<template #desc>{{ $ts.pinnedPagesDescription }}</template>
			</MkTextarea>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faCloud"/> {{ $ts.files }}</div>
		<div class="_content">
			<MkSwitch v-model:value="cacheRemoteFiles">{{ $ts.cacheRemoteFiles }}<template #desc>{{ $ts.cacheRemoteFilesDescription }}</template></MkSwitch>
			<MkSwitch v-model:value="proxyRemoteFiles">{{ $ts.proxyRemoteFiles }}<template #desc>{{ $ts.proxyRemoteFilesDescription }}</template></MkSwitch>
			<MkInput v-model:value="localDriveCapacityMb" type="number">{{ $ts.driveCapacityPerLocalAccount }}<template #suffix>MB</template><template #desc>{{ $ts.inMb }}</template></MkInput>
			<MkInput v-model:value="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles">{{ $ts.driveCapacityPerRemoteAccount }}<template #suffix>MB</template><template #desc>{{ $ts.inMb }}</template></MkInput>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faCloud"/> {{ $ts.objectStorage }}</div>
		<div class="_content">
			<MkSwitch v-model:value="useObjectStorage">{{ $ts.useObjectStorage }}</MkSwitch>
			<template v-if="useObjectStorage">
				<MkInput v-model:value="objectStorageBaseUrl" :disabled="!useObjectStorage">{{ $ts.objectStorageBaseUrl }}<template #desc>{{ $ts.objectStorageBaseUrlDesc }}</template></MkInput>
				<div class="_inputs">
					<MkInput v-model:value="objectStorageBucket" :disabled="!useObjectStorage">{{ $ts.objectStorageBucket }}<template #desc>{{ $ts.objectStorageBucketDesc }}</template></MkInput>
					<MkInput v-model:value="objectStoragePrefix" :disabled="!useObjectStorage">{{ $ts.objectStoragePrefix }}<template #desc>{{ $ts.objectStoragePrefixDesc }}</template></MkInput>
				</div>
				<MkInput v-model:value="objectStorageEndpoint" :disabled="!useObjectStorage">{{ $ts.objectStorageEndpoint }}<template #desc>{{ $ts.objectStorageEndpointDesc }}</template></MkInput>
				<div class="_inputs">
					<MkInput v-model:value="objectStorageRegion" :disabled="!useObjectStorage">{{ $ts.objectStorageRegion }}<template #desc>{{ $ts.objectStorageRegionDesc }}</template></MkInput>
				</div>
				<div class="_inputs">
					<MkInput v-model:value="objectStorageAccessKey" :disabled="!useObjectStorage"><template #icon><Fa :icon="faKey"/></template>Access key</MkInput>
					<MkInput v-model:value="objectStorageSecretKey" :disabled="!useObjectStorage"><template #icon><Fa :icon="faKey"/></template>Secret key</MkInput>
				</div>
				<MkSwitch v-model:value="objectStorageUseSSL" :disabled="!useObjectStorage">{{ $ts.objectStorageUseSSL }}<template #desc>{{ $ts.objectStorageUseSSLDesc }}</template></MkSwitch>
				<MkSwitch v-model:value="objectStorageUseProxy" :disabled="!useObjectStorage">{{ $ts.objectStorageUseProxy }}<template #desc>{{ $ts.objectStorageUseProxyDesc }}</template></MkSwitch>
				<MkSwitch v-model:value="objectStorageSetPublicRead" :disabled="!useObjectStorage">{{ $ts.objectStorageSetPublicRead }}</MkSwitch>
				<MkSwitch v-model:value="objectStorageS3ForcePathStyle" :disabled="!useObjectStorage">s3ForcePathStyle</MkSwitch>
			</template>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faGhost"/> {{ $ts.proxyAccount }}</div>
		<div class="_content">
			<MkInput :value="proxyAccount ? proxyAccount.username : null" disabled><template #prefix>@</template>{{ $ts.proxyAccount }}<template #desc>{{ $ts.proxyAccountDescription }}</template></MkInput>
			<MkButton primary @click="chooseProxyAccount">{{ $ts.chooseProxyAccount }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faBan"/> {{ $ts.blockedInstances }}</div>
		<div class="_content">
			<MkTextarea v-model:value="blockedHosts">
				<template #desc>{{ $ts.blockedInstancesDescription }}</template>
			</MkTextarea>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faShareAlt"/> {{ $ts.integration }}</div>
		<div class="_content">
			<header><Fa :icon="faTwitter"/> Twitter</header>
			<MkSwitch v-model:value="enableTwitterIntegration">{{ $ts.enable }}</MkSwitch>
			<template v-if="enableTwitterIntegration">
				<MkInfo>Callback URL: {{ `${url}/api/tw/cb` }}</MkInfo>
				<MkInput v-model:value="twitterConsumerKey" :disabled="!enableTwitterIntegration"><template #icon><Fa :icon="faKey"/></template>Consumer Key</MkInput>
				<MkInput v-model:value="twitterConsumerSecret" :disabled="!enableTwitterIntegration"><template #icon><Fa :icon="faKey"/></template>Consumer Secret</MkInput>
			</template>
		</div>
		<div class="_content">
			<header><Fa :icon="faGithub"/> GitHub</header>
			<MkSwitch v-model:value="enableGithubIntegration">{{ $ts.enable }}</MkSwitch>
			<template v-if="enableGithubIntegration">
				<MkInfo>Callback URL: {{ `${url}/api/gh/cb` }}</MkInfo>
				<MkInput v-model:value="githubClientId" :disabled="!enableGithubIntegration"><template #icon><Fa :icon="faKey"/></template>Client ID</MkInput>
				<MkInput v-model:value="githubClientSecret" :disabled="!enableGithubIntegration"><template #icon><Fa :icon="faKey"/></template>Client Secret</MkInput>
			</template>
		</div>
		<div class="_content">
			<header><Fa :icon="faDiscord"/> Discord</header>
			<MkSwitch v-model:value="enableDiscordIntegration">{{ $ts.enable }}</MkSwitch>
			<template v-if="enableDiscordIntegration">
				<MkInfo>Callback URL: {{ `${url}/api/dc/cb` }}</MkInfo>
				<MkInput v-model:value="discordClientId" :disabled="!enableDiscordIntegration"><template #icon><Fa :icon="faKey"/></template>Client ID</MkInput>
				<MkInput v-model:value="discordClientSecret" :disabled="!enableDiscordIntegration"><template #icon><Fa :icon="faKey"/></template>Client Secret</MkInput>
			</template>
		</div>
		<div class="_footer">
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>

	<section class="_card _gap">
		<div class="_title"><Fa :icon="faArchway" /> Summaly Proxy</div>
		<div class="_content">
			<MkInput v-model:value="summalyProxy">URL</MkInput>
			<MkButton primary @click="save(true)"><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { faPencilAlt, faShareAlt, faGhost, faCog, faPlus, faCloud, faInfoCircle, faBan, faSave, faServer, faLink, faThumbtack, faUser, faShieldAlt, faKey, faBolt, faArchway } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkTextarea from '@client/components/ui/textarea.vue';
import MkSwitch from '@client/components/ui/switch.vue';
import MkInfo from '@client/components/ui/info.vue';
import { url } from '@client/config';
import getAcct from '@/misc/acct/render';
import * as os from '@client/os';
import { fetchInstance } from '@client/instance';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkTextarea,
		MkSwitch,
		MkInfo,
		Captcha: defineAsyncComponent(() => import('@client/components/captcha.vue')),
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.instance,
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
			objectStorageS3ForcePathStyle: true,
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
		this.objectStorageS3ForcePathStyle = this.meta.objectStorageS3ForcePathStyle;
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
					title: this.$ts.settingGuide,
					text: this.$ts.avoidMultiCaptchaConfirm,
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
					title: this.$ts.settingGuide,
					text: this.$ts.avoidMultiCaptchaConfirm,
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
				objectStorageS3ForcePathStyle: this.objectStorageS3ForcePathStyle,
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
				fetchInstance();
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

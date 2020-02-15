<template>
<div v-if="meta" class="mk-instance-page">
	<portal to="icon"><fa :icon="faServer"/></portal>
	<portal to="title">{{ $t('instance') }}</portal>

	<section class="_card info">
		<div class="_title"><fa :icon="faInfoCircle"/> {{ $t('basicInfo') }}</div>
		<div class="_content">
			<mk-input v-model="name">{{ $t('instanceName') }}</mk-input>
			<mk-textarea v-model="description">{{ $t('instanceDescription') }}</mk-textarea>
			<mk-input v-model="iconUrl"><template #icon><fa :icon="faLink"/></template>{{ $t('iconUrl') }}</mk-input>
			<mk-input v-model="bannerUrl"><template #icon><fa :icon="faLink"/></template>{{ $t('bannerUrl') }}</mk-input>
			<mk-input v-model="tosUrl"><template #icon><fa :icon="faLink"/></template>{{ $t('tosUrl') }}</mk-input>
			<mk-input v-model="maintainerName">{{ $t('maintainerName') }}</mk-input>
			<mk-input v-model="maintainerEmail" type="email"><template #icon><fa :icon="faEnvelope"/></template>{{ $t('maintainerEmail') }}</mk-input>
		</div>
		<div class="_footer">
			<mk-button primary @click="save(true)"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_card info">
		<div class="_content">
			<mk-input v-model="maxNoteTextLength" type="number" :save="() => save()" style="margin:0;"><template #icon><fa :icon="faPencilAlt"/></template>{{ $t('maxNoteTextLength') }}</mk-input>
		</div>
		<div class="_content">
			<mk-switch v-model="enableLocalTimeline" @change="save()">{{ $t('enableLocalTimeline') }}</mk-switch>
			<mk-switch v-model="enableGlobalTimeline" @change="save()">{{ $t('enableGlobalTimeline') }}</mk-switch>
			<mk-info>{{ $t('disablingTimelinesInfo') }}</mk-info>
		</div>
	</section>

	<section class="_card info">
		<div class="_title"><fa :icon="faUser"/> {{ $t('registration') }}</div>
		<div class="_content">
			<mk-switch v-model="enableRegistration" @change="save()">{{ $t('enableRegistration') }}</mk-switch>
			<mk-button v-if="!enableRegistration" @click="invite">{{ $t('invite') }}</mk-button>
		</div>
	</section>

	<section class="_card">
		<div class="_title"><fa :icon="faShieldAlt"/> {{ $t('recaptcha') }}</div>
		<div class="_content">
			<mk-switch v-model="enableRecaptcha">{{ $t('enableRecaptcha') }}</mk-switch>
			<template v-if="enableRecaptcha">
				<mk-input v-model="recaptchaSiteKey" :disabled="!enableRecaptcha"><template #icon><fa :icon="faKey"/></template>{{ $t('recaptchaSiteKey') }}</mk-input>
				<mk-input v-model="recaptchaSecretKey" :disabled="!enableRecaptcha"><template #icon><fa :icon="faKey"/></template>{{ $t('recaptchaSecretKey') }}</mk-input>
			</template>
		</div>
		<div class="_content" v-if="enableRecaptcha && recaptchaSiteKey">
			<header>{{ $t('preview') }}</header>
			<div ref="recaptcha" style="margin: 16px 0 0 0;" :key="recaptchaSiteKey"></div>
		</div>
		<div class="_footer">
			<mk-button primary @click="save(true)"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_card">
		<div class="_title"><fa :icon="faBolt"/> {{ $t('serviceworker') }}</div>
		<div class="_content">
			<mk-switch v-model="enableServiceWorker">{{ $t('enableServiceworker') }}<template #desc>{{ $t('serviceworkerInfo') }}</template></mk-switch>
			<template v-if="enableServiceWorker">
				<mk-horizon-group inputs class="fit-bottom">
					<mk-input v-model="swPublicKey" :disabled="!enableServiceWorker"><template #icon><fa :icon="faKey"/></template>Public key</mk-input>
					<mk-input v-model="swPrivateKey" :disabled="!enableServiceWorker"><template #icon><fa :icon="faKey"/></template>Private key</mk-input>
				</mk-horizon-group>
			</template>
		</div>
		<div class="_footer">
			<mk-button primary @click="save(true)"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_card">
		<div class="_title"><fa :icon="faThumbtack"/> {{ $t('pinnedUsers') }}</div>
		<div class="_content">
			<mk-textarea v-model="pinnedUsers">
				<template #desc>{{ $t('pinnedUsersDescription') }} <button class="_textButton" @click="addPinUser">{{ $t('addUser') }}</button></template>
			</mk-textarea>
		</div>
		<div class="_footer">
			<mk-button primary @click="save(true)"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_card">
		<div class="_title"><fa :icon="faCloud"/> {{ $t('files') }}</div>
		<div class="_content">
			<mk-switch v-model="cacheRemoteFiles">{{ $t('cacheRemoteFiles') }}<template #desc>{{ $t('cacheRemoteFilesDescription') }}</template></mk-switch>
			<mk-switch v-model="proxyRemoteFiles">{{ $t('proxyRemoteFiles') }}<template #desc>{{ $t('proxyRemoteFilesDescription') }}</template></mk-switch>
			<mk-input v-model="localDriveCapacityMb" type="number">{{ $t('driveCapacityPerLocalAccount') }}<template #suffix>MB</template><template #desc>{{ $t('inMb') }}</template></mk-input>
			<mk-input v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles" style="margin-bottom: 0;">{{ $t('driveCapacityPerRemoteAccount') }}<template #suffix>MB</template><template #desc>{{ $t('inMb') }}</template></mk-input>
		</div>
		<div class="_footer">
			<mk-button primary @click="save(true)"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_card">
		<div class="_title"><fa :icon="faGhost"/> {{ $t('proxyAccount') }}</div>
		<div class="_content">
			<mk-input :value="proxyAccount ? proxyAccount.username : null" style="margin: 0;" disabled><template #prefix>@</template>{{ $t('proxyAccount') }}<template #desc>{{ $t('proxyAccountDescription') }}</template></mk-input>
			<mk-button primary @click="chooseProxyAccount">{{ $t('chooseProxyAccount') }}</mk-button>
		</div>
	</section>

	<section class="_card">
		<div class="_title"><fa :icon="faBan"/> {{ $t('blockedInstances') }}</div>
		<div class="_content">
			<mk-textarea v-model="blockedHosts">
				<template #desc>{{ $t('blockedInstancesDescription') }}</template>
			</mk-textarea>
		</div>
		<div class="_footer">
			<mk-button primary @click="save(true)"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_card">
		<div class="_title"><fa :icon="faShareAlt"/> {{ $t('integration') }}</div>
		<div class="_content">
			<header><fa :icon="faTwitter"/> Twitter</header>
			<mk-switch v-model="enableTwitterIntegration">{{ $t('enable') }}</mk-switch>
			<template v-if="enableTwitterIntegration">
				<mk-info>Callback URL: {{ `${url}/api/tw/cb` }}</mk-info>
				<mk-input v-model="twitterConsumerKey" :disabled="!enableTwitterIntegration"><template #icon><fa :icon="faKey"/></template>Consumer Key</mk-input>
				<mk-input v-model="twitterConsumerSecret" :disabled="!enableTwitterIntegration"><template #icon><fa :icon="faKey"/></template>Consumer Secret</mk-input>
			</template>
		</div>
		<div class="_content">
			<header><fa :icon="faGithub"/> GitHub</header>
			<mk-switch v-model="enableGithubIntegration">{{ $t('enable') }}</mk-switch>
			<template v-if="enableGithubIntegration">
				<mk-info>Callback URL: {{ `${url}/api/gh/cb` }}</mk-info>
				<mk-input v-model="githubClientId" :disabled="!enableGithubIntegration"><template #icon><fa :icon="faKey"/></template>Client ID</mk-input>
				<mk-input v-model="githubClientSecret" :disabled="!enableGithubIntegration"><template #icon><fa :icon="faKey"/></template>Client Secret</mk-input>
			</template>
		</div>
		<div class="_content">
			<header><fa :icon="faDiscord"/> Discord</header>
			<mk-switch v-model="enableDiscordIntegration">{{ $t('enable') }}</mk-switch>
			<template v-if="enableDiscordIntegration">
				<mk-info>Callback URL: {{ `${url}/api/dc/cb` }}</mk-info>
				<mk-input v-model="discordClientId" :disabled="!enableDiscordIntegration"><template #icon><fa :icon="faKey"/></template>Client ID</mk-input>
				<mk-input v-model="discordClientSecret" :disabled="!enableDiscordIntegration"><template #icon><fa :icon="faKey"/></template>Client Secret</mk-input>
			</template>
		</div>
		<div class="_footer">
			<mk-button primary @click="save(true)"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_card info">
		<div class="_title"><fa :icon="faInfoCircle"/> {{ $t('instanceInfo') }}</div>
		<div class="_content table" v-if="stats">
			<div><b>{{ $t('users') }}</b><span>{{ stats.originalUsersCount | number }}</span></div>
			<div><b>{{ $t('notes') }}</b><span>{{ stats.originalNotesCount | number }}</span></div>
		</div>
		<div class="_content table">
			<div><b>Misskey</b><span>v{{ version }}</span></div>
		</div>
		<div class="_content table" v-if="serverInfo">
			<div><b>Node.js</b><span>{{ serverInfo.node }}</span></div>
			<div><b>PostgreSQL</b><span>v{{ serverInfo.psql }}</span></div>
			<div><b>Redis</b><span>v{{ serverInfo.redis }}</span></div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPencilAlt, faShareAlt, faGhost, faCog, faPlus, faCloud, faInfoCircle, faBan, faSave, faServer, faLink, faThumbtack, faUser, faShieldAlt, faKey, faBolt } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import MkSwitch from '../../components/ui/switch.vue';
import MkInfo from '../../components/ui/info.vue';
import MkUserSelect from '../../components/user-select.vue';
import { version, url } from '../../config';
import i18n from '../../i18n';
import getAcct from '../../../misc/acct/render';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('instance') as string
		};
	},

	components: {
		MkButton,
		MkInput,
		MkTextarea,
		MkSwitch,
		MkInfo,
	},

	data() {
		return {
			version,
			url,
			stats: null,
			serverInfo: null,
			proxyAccount: null,
			proxyAccountId: null,
			cacheRemoteFiles: false,
			proxyRemoteFiles: false,
			localDriveCapacityMb: 0,
			remoteDriveCapacityMb: 0,
			blockedHosts: '',
			pinnedUsers: '',
			maintainerName: null,
			maintainerEmail: null,
			name: null,
			description: null,
			tosUrl: null,
			bannerUrl: null,
			iconUrl: null,
			maxNoteTextLength: 0,
			enableRegistration: false,
			enableLocalTimeline: false,
			enableGlobalTimeline: false,
			enableRecaptcha: false,
			recaptchaSiteKey: null,
			recaptchaSecretKey: null,
			enableServiceWorker: false,
			swPublicKey: null,
			swPrivateKey: null,
			enableTwitterIntegration: false,
			twitterConsumerKey: null,
			twitterConsumerSecret: null,
			enableGithubIntegration: false,
			githubClientId: null,
			githubClientSecret: null,
			enableDiscordIntegration: false,
			discordClientId: null,
			discordClientSecret: null,
			faPencilAlt, faTwitter, faDiscord, faGithub, faShareAlt, faTrashAlt, faGhost, faCog, faPlus, faCloud, faInfoCircle, faBan, faSave, faServer, faLink, faEnvelope, faThumbtack, faUser, faShieldAlt, faKey, faBolt
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
	},

	created() {
		this.name = this.meta.name;
		this.description = this.meta.description;
		this.tosUrl = this.meta.tosUrl;
		this.bannerUrl = this.meta.bannerUrl;
		this.iconUrl = this.meta.iconUrl;
		this.maintainerName = this.meta.maintainerName;
		this.maintainerEmail = this.meta.maintainerEmail;
		this.maxNoteTextLength = this.meta.maxNoteTextLength;
		this.enableRegistration = !this.meta.disableRegistration;
		this.enableLocalTimeline = !this.meta.disableLocalTimeline;
		this.enableGlobalTimeline = !this.meta.disableGlobalTimeline;
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
		this.enableServiceWorker = this.meta.enableServiceWorker;
		this.swPublicKey = this.meta.swPublickey;
		this.swPrivateKey = this.meta.swPrivateKey;
		this.enableTwitterIntegration = this.meta.enableTwitterIntegration;
		this.twitterConsumerKey = this.meta.twitterConsumerKey;
		this.twitterConsumerSecret = this.meta.twitterConsumerSecret;
		this.enableGithubIntegration = this.meta.enableGithubIntegration;
		this.githubClientId = this.meta.githubClientId;
		this.githubClientSecret = this.meta.githubClientSecret;
		this.enableDiscordIntegration = this.meta.enableDiscordIntegration;
		this.discordClientId = this.meta.discordClientId;
		this.discordClientSecret = this.meta.discordClientSecret;

		if (this.proxyAccountId) {
			this.$root.api('users/show', { userId: this.proxyAccountId }).then(proxyAccount => {
				this.proxyAccount = proxyAccount;
			});
		}

		this.$root.api('admin/server-info').then(res => {
			this.serverInfo = res;
		});

		this.$root.api('stats').then(res => {
			this.stats = res;
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
		addPinUser() {
			this.$root.new(MkUserSelect, {}).$once('selected', user => {
				this.pinnedUsers = this.pinnedUsers.trim();
				this.pinnedUsers += '\n@' + getAcct(user);
				this.pinnedUsers = this.pinnedUsers.trim();
			});
		},

		chooseProxyAccount() {
			this.$root.new(MkUserSelect, {}).$once('selected', user => {
				this.proxyAccount = user;
				this.proxyAccountId = user.id;
				this.save(true);
			});
		},

		save(withDialog = false) {
			this.$root.api('admin/update-meta', {
				name: this.name,
				description: this.description,
				tosUrl: this.tosUrl,
				bannerUrl: this.bannerUrl,
				iconUrl: this.iconUrl,
				maintainerName: this.maintainerName,
				maintainerEmail: this.maintainerEmail,
				maxNoteTextLength: this.maxNoteTextLength,
				disableRegistration: !this.enableRegistration,
				disableLocalTimeline: !this.enableLocalTimeline,
				disableGlobalTimeline: !this.enableGlobalTimeline,
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
				enableServiceWorker: this.enableServiceWorker,
				swPublicKey: this.swPublicKey,
				swPrivateKey: this.swPrivateKey,
				enableTwitterIntegration: this.enableTwitterIntegration,
				twitterConsumerKey: this.twitterConsumerKey,
				twitterConsumerSecret: this.twitterConsumerSecret,
				enableGithubIntegration: this.enableGithubIntegration,
				githubClientId: this.githubClientId,
				githubClientSecret: this.githubClientSecret,
				enableDiscordIntegration: this.enableDiscordIntegration,
				discordClientId: this.discordClientId,
				discordClientSecret: this.discordClientSecret,
			}).then(() => {
				this.$store.dispatch('instance/fetch');
				if (withDialog) {
					this.$root.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				}
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

<style lang="scss" scoped>
.mk-instance-page {
	> .info {
		> .table {
			> div {
				display: flex;

				> * {
					flex: 1;
				}
			}
		}
	}
}
</style>

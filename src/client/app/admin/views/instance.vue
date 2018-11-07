<template>
<div class="axbwjelsbymowqjyywpirzhdlszoncqs">
	<ui-card>
		<div slot="title"><fa icon="cog"/> %i18n:@instance%</div>
		<section class="fit-top fit-bottom">
			<ui-input v-model="name">%i18n:@instance-name%</ui-input>
			<ui-textarea v-model="description">%i18n:@instance-description%</ui-textarea>
			<ui-input v-model="bannerUrl"><i slot="icon"><fa icon="link"/></i>%i18n:@banner-url%</ui-input>
			<ui-input v-model="languages"><i slot="icon"><fa icon="language"/></i>%i18n:@languages%<span slot="desc">%i18n:@languages-desc%</span></ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa icon="headset"/> %i18n:@maintainer-config%</header>
			<ui-input v-model="maintainerName">%i18n:@maintainer-name%</ui-input>
			<ui-input v-model="maintainerEmail" type="email"><i slot="icon"><fa :icon="['far', 'envelope']"/></i>%i18n:@maintainer-email%</ui-input>
		</section>
		<section class="fit-top fit-bottom">
			<ui-input v-model="maxNoteTextLength">%i18n:@max-note-text-length%</ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa icon="cloud"/> %i18n:@drive-config%</header>
			<ui-switch v-model="cacheRemoteFiles">%i18n:@cache-remote-files%<span slot="desc">%i18n:@cache-remote-files-desc%</span></ui-switch>
			<ui-input v-model="localDriveCapacityMb">%i18n:@local-drive-capacity-mb%<span slot="suffix">MB</span><span slot="desc">%i18n:@mb%</span></ui-input>
			<ui-input v-model="remoteDriveCapacityMb" :disabled="!cacheRemoteFiles">%i18n:@remote-drive-capacity-mb%<span slot="suffix">MB</span><span slot="desc">%i18n:@mb%</span></ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa icon="shield-alt"/> %i18n:@recaptcha-config%</header>
			<ui-switch v-model="enableRecaptcha">%i18n:@enable-recaptcha%</ui-switch>
			<ui-info>%i18n:@recaptcha-info%</ui-info>
			<ui-input v-model="recaptchaSiteKey" :disabled="!enableRecaptcha"><i slot="icon"><fa icon="key"/></i>%i18n:@recaptcha-site-key%</ui-input>
			<ui-input v-model="recaptchaSecretKey" :disabled="!enableRecaptcha"><i slot="icon"><fa icon="key"/></i>%i18n:@recaptcha-secret-key%</ui-input>
		</section>
		<section>
			<header><fa icon="ghost"/> %i18n:@proxy-account-config%</header>
			<ui-info>%i18n:@proxy-account-info%</ui-info>
			<ui-input v-model="proxyAccount"><span slot="prefix">@</span>%i18n:@proxy-account-username%<span slot="desc">%i18n:@proxy-account-username-desc%</span></ui-input>
			<ui-info warn>%i18n:@proxy-account-warn%</ui-info>
		</section>
		<section>
			<ui-switch v-model="disableRegistration">%i18n:@disable-registration%</ui-switch>
		</section>
		<section>
			<ui-switch v-model="disableLocalTimeline">%i18n:@disable-local-timeline%</ui-switch>
		</section>
		<section>
			<ui-button @click="updateMeta">%i18n:@save%</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">%i18n:@invite%</div>
		<section>
			<ui-button @click="invite">%i18n:@invite%</ui-button>
			<p v-if="inviteCode">Code: <code>{{ inviteCode }}</code></p>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
	data() {
		return {
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
			proxyAccount: null,
			inviteCode: null,
		};
	},

	created() {
		(this as any).os.getMeta().then(meta => {
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
		});
	},

	methods: {
		invite() {
			(this as any).api('admin/invite').then(x => {
				this.inviteCode = x.code;
			}).catch(e => {
				this.$swal({
					type: 'error',
					text: e
				});
			});
		},

		updateMeta() {
			(this as any).api('admin/update-meta', {
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
			}).then(() => {
				this.$swal({
					type: 'success',
					text: '%i18n:@saved%'
				});
			}).catch(e => {
				this.$swal({
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

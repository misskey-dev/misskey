<template>
<div class="axbwjelsbymowqjyywpirzhdlszoncqs">
	<ui-card>
		<div slot="title"><fa icon="cog"/> %i18n:@instance%</div>
		<section class="fit-top fit-bottom">
			<ui-input v-model="name">%i18n:@instance-name%</ui-input>
			<ui-textarea v-model="description">%i18n:@instance-description%</ui-textarea>
			<ui-input v-model="bannerUrl"><i slot="icon"><fa icon="link"/></i>%i18n:@banner-url%</ui-input>
		</section>
		<section class="fit-top fit-bottom">
			<ui-input v-model="maxNoteTextLength">%i18n:@max-note-text-length%</ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa icon="cloud"/> %i18n:@drive-config%</header>
			<ui-switch v-model="cacheRemoteFiles">%i18n:@cache-remote-files%<span slot="desc">%i18n:@cache-remote-files-desc%</span></ui-switch>
			<ui-input v-model="localDriveCapacityMb">%i18n:@local-drive-capacity-mb%<span slot="desc">%i18n:@mb%</span><span slot="suffix">MB</span></ui-input>
			<ui-input v-model="remoteDriveCapacityMb" :disabled="!cacheRemoteFiles">%i18n:@remote-drive-capacity-mb%<span slot="desc">%i18n:@mb%</span><span slot="suffix">MB</span></ui-input>
		</section>
		<section class="fit-bottom">
			<header><fa icon="shield-alt"/> %i18n:@recaptcha-config%</header>
			<ui-switch v-model="enableRecaptcha">%i18n:@enable-recaptcha%</ui-switch>
			<ui-info>%i18n:@recaptcha-info%</ui-info>
			<ui-input v-model="recaptchaSiteKey" :disabled="!enableRecaptcha"><i slot="icon"><fa icon="key"/></i>%i18n:@recaptcha-site-key%</ui-input>
			<ui-input v-model="recaptchaSecretKey" :disabled="!enableRecaptcha"><i slot="icon"><fa icon="key"/></i>%i18n:@recaptcha-secret-key%</ui-input>
		</section>
		<section>
			<ui-button @click="updateMeta">%i18n:@save%</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">%i18n:@disable-registration%</div>
		<section>
			<input type="checkbox" v-model="disableRegistration" @change="updateMeta">
			<button class="ui" @click="invite">%i18n:@invite%</button>
			<p v-if="inviteCode">Code: <code>{{ inviteCode }}</code></p>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">%i18n:@disable-local-timeline%</div>
		<section>
			<input type="checkbox" v-model="disableLocalTimeline" @change="updateMeta">
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
	data() {
		return {
			disableRegistration: false,
			disableLocalTimeline: false,
			bannerUrl: null,
			name: null,
			description: null,
			cacheRemoteFiles: false,
			localDriveCapacityMb: null,
			remoteDriveCapacityMb: null,
			maxNoteTextLength: null,
			enableRecaptcha: false,
			recaptchaSiteKey: null,
			recaptchaSecretKey: null,
			inviteCode: null,
		};
	},

	created() {
		(this as any).os.getMeta().then(meta => {
			this.bannerUrl = meta.bannerUrl;
			this.name = meta.name;
			this.description = meta.description;
			this.cacheRemoteFiles = meta.cacheRemoteFiles;
			this.localDriveCapacityMb = meta.driveCapacityPerLocalUserMb;
			this.remoteDriveCapacityMb = meta.driveCapacityPerRemoteUserMb;
			this.maxNoteTextLength = meta.maxNoteTextLength;
			this.enableRecaptcha = meta.enableRecaptcha;
			this.recaptchaSiteKey = meta.recaptchaSiteKey;
			this.recaptchaSecretKey = meta.recaptchaSecretKey;
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
				disableRegistration: this.disableRegistration,
				disableLocalTimeline: this.disableLocalTimeline,
				bannerUrl: this.bannerUrl,
				name: this.name,
				description: this.description,
				cacheRemoteFiles: this.cacheRemoteFiles,
				localDriveCapacityMb: parseInt(this.localDriveCapacityMb, 10),
				remoteDriveCapacityMb: parseInt(this.remoteDriveCapacityMb, 10),
				maxNoteTextLength: parseInt(this.maxNoteTextLength, 10),
				enableRecaptcha: this.enableRecaptcha,
				recaptchaSiteKey: this.recaptchaSiteKey,
				recaptchaSecretKey: this.recaptchaSecretKey
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

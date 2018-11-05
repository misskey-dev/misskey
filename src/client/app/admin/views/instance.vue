<template>
<div class="axbwjelsbymowqjyywpirzhdlszoncqs">
	<ui-card>
		<div slot="title"><fa icon="cog"/> %i18n:@instance%</div>
		<section class="fit-top">
			<ui-input v-model="name">%i18n:@instance-name%</ui-input>
			<ui-textarea v-model="description">%i18n:@instance-description%</ui-textarea>
			<ui-input v-model="bannerUrl">%i18n:@banner-url%</ui-input>
		</section>
		<section class="fit-top fit-bottom">
			<ui-input v-model="maxNoteTextLength">%i18n:@max-note-text-length%</ui-input>
		</section>
		<section class="fit-bottom">
			<header>%i18n:@drive-config%</header>
			<ui-input v-model="localDriveCapacityMb">%i18n:@local-drive-capacity-mb%<span slot="text">%i18n:@mb%</span></ui-input>
			<ui-input v-model="remoteDriveCapacityMb">%i18n:@remote-drive-capacity-mb%<span slot="text">%i18n:@mb%</span></ui-input>
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
			localDriveCapacityMb: null,
			remoteDriveCapacityMb: null,
			maxNoteTextLength: null,
			inviteCode: null,
		};
	},

	created() {
		(this as any).os.getMeta().then(meta => {
			this.bannerUrl = meta.bannerUrl;
			this.name = meta.name;
			this.description = meta.description;
			this.localDriveCapacityMb = meta.driveCapacityPerLocalUserMb;
			this.remoteDriveCapacityMb = meta.driveCapacityPerRemoteUserMb;
			this.maxNoteTextLength = meta.maxNoteTextLength;
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
				localDriveCapacityMb: parseInt(this.localDriveCapacityMb, 10),
				remoteDriveCapacityMb: parseInt(this.remoteDriveCapacityMb, 10),
				maxNoteTextLength: parseInt(this.maxNoteTextLength, 10)
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

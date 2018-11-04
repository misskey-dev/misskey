<template>
<div class="axbwjelsbymowqjyywpirzhdlszoncqs">
	<ui-card>
		<div slot="title">%i18n:@instance%</div>
		<section class="fit-top">
			<ui-input v-model="name">%i18n:@instance-name%</ui-input>
			<ui-textarea v-model="description">%i18n:@instance-description%</ui-textarea>
			<ui-input v-model="bannerUrl">%i18n:@banner-url%</ui-input>
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
			inviteCode: null,
		};
	},

	created() {
		(this as any).os.getMeta().then(meta => {
			this.bannerUrl = meta.bannerUrl;
			this.name = meta.name;
			this.description = meta.description;
		});
	},

	methods: {
		invite() {
			(this as any).api('admin/invite').then(x => {
				this.inviteCode = x.code;
			}).catch(e => {
				//(this as any).os.apis.dialog({ text: `Failed ${e}` });
			});
		},

		updateMeta() {
			(this as any).api('admin/update-meta', {
				disableRegistration: this.disableRegistration,
				disableLocalTimeline: this.disableLocalTimeline,
				bannerUrl: this.bannerUrl,
				name: this.name,
				description: this.description
			}).then(() => {
				//(this as any).os.apis.dialog({ text: `Saved` });
			}).catch(e => {
				//(this as any).os.apis.dialog({ text: `Failed ${e}` });
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

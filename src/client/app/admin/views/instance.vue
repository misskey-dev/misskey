<template>
<div>
	<ui-card>
		<div slot="title">%i18n:@banner-url%</div>
		<section class="fit-top">
			<ui-input v-model="bannerUrl"/>
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
			inviteCode: null,
		};
	},
	methods: {
		invite() {
			(this as any).api('admin/invite').then(x => {
				this.inviteCode = x.code;
			}).catch(e => {
				(this as any).os.apis.dialog({ text: `Failed ${e}` });
			});
		},
		updateMeta() {
			(this as any).api('admin/update-meta', {
				disableRegistration: this.disableRegistration,
				disableLocalTimeline: this.disableLocalTimeline,
				bannerUrl: this.bannerUrl
			}).then(() => {
				(this as any).os.apis.dialog({ text: `Saved` });
			}).catch(e => {
				(this as any).os.apis.dialog({ text: `Failed ${e}` });
			});
		}
	}
});
</script>

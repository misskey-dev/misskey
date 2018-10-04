<template>
<div class="qldxjjsrseehkusjuoooapmsprvfrxyl mk-admin-card">
	<header>%i18n:@announcements%</header>
	<textarea v-model="broadcasts" placeholder='[ { "title": "Title1", "text": "Text1" }, { "title": "Title2", "text": "Text2" } ]'></textarea>
	<button class="ui" @click="save">%i18n:@save%</button>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
	data() {
		return {
			broadcasts: '',
		};
	},
	created() {
		(this as any).os.getMeta().then(meta => {
			this.broadcasts = JSON.stringify(meta.broadcasts, null, '  ');
		});
	},
	methods: {
		save() {
			let json;

			try {
				json = JSON.parse(this.broadcasts);
			} catch (e) {
				(this as any).os.apis.dialog({ text: `Failed: ${e}` });
				return;
			}

			(this as any).api('admin/update-meta', {
				broadcasts: json
			}).then(() => {
				(this as any).os.apis.dialog({ text: `Saved` });
			}.catch(e => {
				(this as any).os.apis.dialog({ text: `Failed ${e}` });
			});
		}
	}
});
</script>

<style lang="stylus" scoped>


.qldxjjsrseehkusjuoooapmsprvfrxyl
	textarea
		width 100%
		min-height 300px

</style>

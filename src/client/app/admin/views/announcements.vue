<template>
<div>
	<ui-card>
		<div slot="title">%i18n:@announcements%</div>
		<section>
			<textarea class="qldxjjsrseehkusjuoooapmsprvfrxyl" v-model="broadcasts" placeholder='[ { "title": "Title1", "text": "Text1" }, { "title": "Title2", "text": "Text2" } ]'></textarea>
			<ui-button @click="save">%i18n:@save%</ui-button>
		</section>
	</ui-card>
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
	width 100%
	min-height 300px

</style>

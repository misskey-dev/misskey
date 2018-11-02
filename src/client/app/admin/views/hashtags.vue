<template>
<div>
	<ui-card>
		<div slot="title">%i18n:@hided-tags%</div>
		<section>
			<textarea class="jdnqwkzlnxcfftthoybjxrebyolvoucw" v-model="hidedTags"></textarea>
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
			hidedTags: '',
		};
	},
	created() {
		(this as any).os.getMeta().then(meta => {
			this.hidedTags = meta.hidedTags.join('\n');
		});
	},
	methods: {
		save() {
			(this as any).api('admin/update-meta', {
				hidedTags: this.hidedTags.split('\n')
			}).then(() => {
				(this as any).os.apis.dialog({ text: `Saved` });
			}).catch(e => {
				(this as any).os.apis.dialog({ text: `Failed ${e}` });
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.jdnqwkzlnxcfftthoybjxrebyolvoucw
	width 100%
	min-height 300px

</style>

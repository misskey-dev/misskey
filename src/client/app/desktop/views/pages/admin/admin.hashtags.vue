<template>
<div class="jdnqwkzlnxcfftthoybjxrebyolvoucw mk-admin-card">
	<header>%i18n:@hided-tags%</header>
	<textarea v-model="hidedTags"></textarea>
	<button class="ui" @click="save">%i18n:@save%</button>
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
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.jdnqwkzlnxcfftthoybjxrebyolvoucw
	textarea
		width 100%
		min-height 300px

</style>

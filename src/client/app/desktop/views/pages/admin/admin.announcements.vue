<template>
<div class="qldxjjsrseehkusjuoooapmsprvfrxyl mk-admin-card">
	<header>%i18n:@announcements%</header>
	<textarea v-model="broadcasts"></textarea>
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
			(this as any).api('admin/update-meta', {
				broadcasts: JSON.parse(this.broadcasts)
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.qldxjjsrseehkusjuoooapmsprvfrxyl
	textarea
		width 100%
		min-height 300px

</style>

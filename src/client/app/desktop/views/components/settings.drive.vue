<template>
<div class="root">
	<template v-if="!fetching">
		<p><b>{{ capacity | bytes }}</b>%i18n:@max%<b>{{ usage | bytes }}</b>%i18n:@in-use%</p>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			fetching: true,
			usage: null,
			capacity: null
		};
	},
	mounted() {
		(this as any).api('drive').then(info => {
			this.capacity = info.capacity;
			this.usage = info.usage;
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.root
	> p
		> b
			margin 0 8px
</style>

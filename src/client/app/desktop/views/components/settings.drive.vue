<template>
<div class="root">
	<template v-if="!fetching">
		<el-progress :text-inside="true" :stroke-width="18" :percentage="Math.floor((usage / capacity) * 100)"/>
		<p><b>{{ capacity | bytes }}</b>中<b>{{ usage | bytes }}</b>使用中</p>
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

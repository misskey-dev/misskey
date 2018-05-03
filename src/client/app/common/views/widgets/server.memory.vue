<template>
<div class="memory">
	<x-pie class="pie" :value="usage"/>
	<div>
		<p>%fa:flask%Memory</p>
		<p>Total: {{ total | bytes(1) }}</p>
		<p>Used: {{ used | bytes(1) }}</p>
		<p>Free: {{ free | bytes(1) }}</p>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XPie from './server.pie.vue';

export default Vue.extend({
	components: {
		XPie
	},
	props: ['connection'],
	data() {
		return {
			usage: 0,
			total: 0,
			used: 0,
			free: 0
		};
	},
	mounted() {
		this.connection.on('stats', this.onStats);
	},
	beforeDestroy() {
		this.connection.off('stats', this.onStats);
	},
	methods: {
		onStats(stats) {
			stats.mem.used = stats.mem.total - stats.mem.free;
			this.usage = stats.mem.used / stats.mem.total;
			this.total = stats.mem.total;
			this.used = stats.mem.used;
			this.free = stats.mem.free;
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	> .pie
		padding 10px
		height 100px
		float left

	> div
		float left
		width calc(100% - 100px)
		padding 10px 10px 10px 0

		> p
			margin 0
			font-size 12px
			color isDark ? #a8b4bd : #505050

			&:first-child
				font-weight bold

				> [data-fa]
					margin-right 4px

	&:after
		content ""
		display block
		clear both

.memory[data-darkmode]
	root(true)

.memory:not([data-darkmode])
	root(false)

</style>

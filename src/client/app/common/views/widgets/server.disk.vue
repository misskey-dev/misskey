<template>
<div class="disk">
	<x-pie class="pie" :value="usage"/>
	<div>
		<p>%fa:R hdd%Storage</p>
		<p>Total: {{ total | bytes(1) }}</p>
		<p>Available: {{ available | bytes(1) }}</p>
		<p>Used: {{ used | bytes(1) }}</p>
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
			available: 0
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
			stats.disk.used = stats.disk.total - stats.disk.free;
			this.usage = stats.disk.used / stats.disk.total;
			this.total = stats.disk.total;
			this.used = stats.disk.used;
			this.available = stats.disk.available;
		}
	}
});
</script>

<style lang="stylus" scoped>
.disk
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
			color #505050

			&:first-child
				font-weight bold

				> [data-fa]
					margin-right 4px

	&:after
		content ""
		display block
		clear both

</style>

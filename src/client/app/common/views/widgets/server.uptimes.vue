<template>
<div class="uptimes">
	<p>Uptimes</p>
	<p>Process: {{ process }}</p>
	<p>OS: {{ os }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import formatUptime from '../../scripts/format-uptime';

export default Vue.extend({
	props: ['connection'],
	data() {
		return {
			process: 0,
			os: 0
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
			this.process = formatUptime(stats.process_uptime);
			this.os = formatUptime(stats.os_uptime);
		}
	}
});
</script>

<style lang="stylus" scoped>
.uptimes
	padding 10px 14px

	> p
		margin 0
		font-size 12px
		color var(--text)

		&:first-child
			font-weight bold
</style>

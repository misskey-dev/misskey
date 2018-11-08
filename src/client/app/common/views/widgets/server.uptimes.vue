<template>
<div class="uptimes">
	<p>Uptimes</p>
	<p>Process: {{ process ? process.toFixed(0) : '---' }}s</p>
	<p>OS: {{ os ? os.toFixed(0) : '---' }}s</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

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
			this.process = stats.process_uptime;
			this.os = stats.os_uptime;
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
		color #505050

		&:first-child
			font-weight bold
</style>

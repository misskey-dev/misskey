<template>
<div class="tcrwdhwpuxrwmcttxjcsehgpagpstqey">
	<div>
		<x-charts/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import XCharts from "../../components/charts.vue";

export default Vue.extend({
	components: {
		XCharts
	}
});
</script>

<style lang="stylus">
@import '~const.styl'

.tcrwdhwpuxrwmcttxjcsehgpagpstqey
	width 100%
	padding 16px 32px

	> div
		max-width 800px
</style>

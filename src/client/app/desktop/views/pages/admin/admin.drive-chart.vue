<template>
<div class="card">
	<header>%i18n:@title%</header>
	<div class="card">
		<header>%i18n:@local%</header>
		<x-chart v-if="chart" :chart="chart" type="local"/>
	</div>
	<div class="card">
		<header>%i18n:@remote%</header>
		<x-chart v-if="chart" :chart="chart" type="remote"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import XChart from "./admin.drive-chart.chart.vue";

export default Vue.extend({
	components: {
		XChart
	},
	props: {
		chart: {
			required: true
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

</style>

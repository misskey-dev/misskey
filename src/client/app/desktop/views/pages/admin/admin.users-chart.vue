<template>
<div class="card">
	<header>%i18n:@title%</header>
	<div class="card">
		<header>%i18n:@local%</header>
		<x-chart v-if="data" :data="data" type="local"/>
	</div>
	<div class="card">
		<header>%i18n:@remote%</header>
		<x-chart v-if="data" :data="data" type="remote"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import XChart from "./admin.users-chart.chart.vue";

export default Vue.extend({
	components: {
		XChart
	},
	data() {
		return {
			data: null
		};
	},
	created() {
		(this as any).api('aggregation/users').then(res => {
			this.data = res;
		});
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

</style>

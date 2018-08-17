<template>
<div>
	<header>%i18n:@title%</header>
	<x-chart v-if="data" :data="data" type="local"/>
	<x-chart v-if="data" :data="data" type="remote"/>
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

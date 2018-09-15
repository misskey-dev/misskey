<template>
<div class="csqvmxybqbycalfhkxvyfrgbrdalkaoc">
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<p class="empty" v-else-if="stats.length == 0">%fa:exclamation-circle%%i18n:@empty%</p>
	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<transition-group v-else tag="div" name="chart">
		<div v-for="stat in stats" :key="stat.tag">
			<div class="tag">
				<router-link :to="`/tags/${ encodeURIComponent(stat.tag) }`" :title="stat.tag">#{{ stat.tag }}</router-link>
				<p>{{ '%i18n:@count%'.replace('{}', stat.usersCount) }}</p>
			</div>
			<x-chart class="chart" :src="stat.chart"/>
		</div>
	</transition-group>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XChart from './trends.chart.vue';

export default Vue.extend({
	components: {
		XChart
	},
	data() {
		return {
			stats: [],
			fetching: true,
			clock: null
		};
	},
	mounted() {
		this.fetch();
		this.clock = setInterval(this.fetch, 1000 * 60);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		fetch() {
			(this as any).api('hashtags/trend').then(stats => {
				this.stats = stats;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	> .fetching
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

	> div
		.chart-move
			transition transform 1s ease

		> div
			display flex
			align-items center
			padding 14px 16px

			&:not(:last-child)
				border-bottom solid 1px isDark ? #393f4f : #eee

			> .tag
				flex 1
				overflow hidden
				font-size 14px
				color isDark ? #9baec8 : #65727b

				> a
					display block
					width 100%
					white-space nowrap
					overflow hidden
					text-overflow ellipsis
					color inherit

				> p
					margin 0
					font-size 75%
					opacity 0.7

			> .chart
				height 30px

.csqvmxybqbycalfhkxvyfrgbrdalkaoc[data-darkmode]
	root(true)

.csqvmxybqbycalfhkxvyfrgbrdalkaoc:not([data-darkmode])
	root(false)

</style>

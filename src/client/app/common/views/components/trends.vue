<template>
<div class="csqvmxybqbycalfhkxvyfrgbrdalkaoc">
	<p class="fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
	<p class="empty" v-else-if="stats.length == 0"><fa icon="exclamation-circle"/>{{ $t('empty') }}</p>
	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<transition-group v-else tag="div" name="chart">
		<div v-for="stat in stats" :key="stat.name">
			<div class="tag">
				<router-link :to="`/tags/${ encodeURIComponent(stat.name) }`" :title="stat.name">#{{ stat.name }}</router-link>
				<p>{{ $t('count').replace('{}', stat.usersCount) }}</p>
			</div>
			<x-chart class="chart" :src="stat.chart"/>
		</div>
	</transition-group>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XChart from './trends.chart.vue';

export default Vue.extend({
	i18n: i18n('common/views/components/trends.vue'),
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
			this.$root.api('hashtags/trend').then(stats => {
				this.stats = stats;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.csqvmxybqbycalfhkxvyfrgbrdalkaoc
	> .fetching
	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)
		opacity 0.7

		> [data-icon]
			margin-right 4px

	> div
		.chart-move
			transition transform 1s ease

		> div
			display flex
			align-items center
			padding 14px 16px

			&:not(:last-child)
				border-bottom solid 1px var(--faceDivider)

			> .tag
				flex 1
				overflow hidden
				font-size 14px
				color var(--text)

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

</style>

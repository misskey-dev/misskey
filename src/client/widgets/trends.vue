<template>
<mk-container :show-header="props.showHeader">
	<template #header><fa :icon="faHashtag"/>{{ $t('_widgets.trends') }}</template>

	<div class="wbrkwala">
		<mk-loading v-if="fetching"/>
		<transition-group tag="div" name="chart" class="tags" v-else>
			<div v-for="stat in stats" :key="stat.tag">
				<div class="tag">
					<router-link class="a" :to="`/tags/${ encodeURIComponent(stat.tag) }`" :title="stat.tag">#{{ stat.tag }}</router-link>
					<p>{{ $t('nUsersMentioned', { n: stat.usersCount }) }}</p>
				</div>
				<mk-mini-chart class="chart" :src="stat.chart"/>
			</div>
		</transition-group>
	</div>
</mk-container>
</template>

<script lang="ts">
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '../components/ui/container.vue';
import define from './define';
import MkMiniChart from '../components/mini-chart.vue';

export default define({
	name: 'hashtags',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
	})
}).extend({
	components: {
		MkContainer, MkMiniChart
	},
	data() {
		return {
			stats: [],
			fetching: true,
			faHashtag
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

<style lang="scss" scoped>
.wbrkwala {
	height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
	overflow: hidden;

	> .tags {
		.chart-move {
			transition: transform 1s ease;
		}

		> div {
			display: flex;
			align-items: center;
			padding: 14px 16px;
			border-bottom: solid 1px var(--divider);

			> .tag {
				flex: 1;
				overflow: hidden;
				font-size: 0.9em;
				color: var(--fg);

				> .a {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 18px;
				}

				> p {
					margin: 0;
					font-size: 75%;
					opacity: 0.7;
					line-height: 16px;
				}
			}

			> .chart {
				height: 30px;
			}
		}
	}
}
</style>

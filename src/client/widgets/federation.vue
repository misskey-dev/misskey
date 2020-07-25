<template>
<mk-container :show-header="props.showHeader">
	<template #header><fa :icon="faGlobe"/>{{ $t('_widgets.federation') }}</template>

	<div class="wbrkwalb">
		<mk-loading v-if="fetching"/>
		<transition-group tag="div" name="chart" class="instances" v-else>
			<div v-for="instance in instances" :key="instance.id">
				<div class="instance">
					<a class="a" :href="'https://' + instance.host" target="_blank" :title="instance.host">#{{ instance.host }}</a>
					<p>{{ instance.softwareName }} {{ instance.softwareVersion }}</p>
				</div>
				<x-chart class="chart" :src="stat.chart"/>
			</div>
		</transition-group>
	</div>
</mk-container>
</template>

<script lang="ts">
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '../components/ui/container.vue';
import define from './define';
import XChart from './trends.chart.vue';

export default define({
	name: 'federation',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
	})
}).extend({
	components: {
		MkContainer, XChart
	},
	data() {
		return {
			instances: [],
			fetching: true,
			faGlobe
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
			this.$root.api('federation/instances', {
				sort: '+lastCommunicatedAt',
				limit: 5
			}).then(instances => {
				this.instances = instances;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.wbrkwalb {
	height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
	overflow: hidden;

	> .instances {
		.chart-move {
			transition: transform 1s ease;
		}

		> div {
			display: flex;
			align-items: center;
			padding: 14px 16px;
			border-bottom: solid 1px var(--divider);

			> .instance {
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

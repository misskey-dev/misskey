<template>
<MkContainer :show-header="props.showHeader" :foldable="foldable" :scrollable="scrollable">
	<template #header><i class="fas fa-globe"></i>{{ $ts._widgets.federation }}</template>

	<div class="wbrkwalb">
		<MkLoading v-if="fetching"/>
		<transition-group tag="div" name="chart" class="instances" v-else>
			<div v-for="(instance, i) in instances" :key="instance.id" class="instance">
				<img v-if="instance.iconUrl" :src="instance.iconUrl" alt=""/>
				<div class="body">
					<a class="a" :href="'https://' + instance.host" target="_blank" :title="instance.host">{{ instance.host }}</a>
					<p>{{ instance.softwareName || '?' }} {{ instance.softwareVersion }}</p>
				</div>
				<MkMiniChart class="chart" :src="charts[i].requests.received"/>
			</div>
		</transition-group>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkContainer from '@client/components/ui/container.vue';
import define from './define';
import MkMiniChart from '@client/components/mini-chart.vue';
import * as os from '@client/os';

const widget = define({
	name: 'federation',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
	})
});

export default defineComponent({
	extends: widget,
	components: {
		MkContainer, MkMiniChart
	},
	props: {
		foldable: {
			type: Boolean,
			required: false,
			default: false
		},
		scrollable: {
			type: Boolean,
			required: false,
			default: false
		},
	},
	data() {
		return {
			instances: [],
			charts: [],
			fetching: true,
		};
	},
	mounted() {
		this.fetch();
		this.clock = setInterval(this.fetch, 1000 * 60);
	},
	beforeUnmount() {
		clearInterval(this.clock);
	},
	methods: {
		async fetch() {
			const instances = await os.api('federation/instances', {
				sort: '+lastCommunicatedAt',
				limit: 5
			});
			const charts = await Promise.all(instances.map(i => os.api('charts/instance', { host: i.host, limit: 16, span: 'hour' })));
			this.instances = instances;
			this.charts = charts;
			this.fetching = false;
		}
	}
});
</script>

<style lang="scss" scoped>
.wbrkwalb {
	$bodyTitleHieght: 18px;
	$bodyInfoHieght: 16px;

	height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
	overflow: hidden;

	> .instances {
		.chart-move {
			transition: transform 1s ease;
		}

		> .instance {
			display: flex;
			align-items: center;
			padding: 14px 16px;
			border-bottom: solid 0.5px var(--divider);

			> img {
				display: block;
				width: ($bodyTitleHieght + $bodyInfoHieght);
				height: ($bodyTitleHieght + $bodyInfoHieght);
				object-fit: cover;
				border-radius: 4px;
				margin-right: 8px;
			}

			> .body {
				flex: 1;
				overflow: hidden;
				font-size: 0.9em;
				color: var(--fg);
				padding-right: 8px;

				> .a {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: $bodyTitleHieght;
				}

				> p {
					margin: 0;
					font-size: 75%;
					opacity: 0.7;
					line-height: $bodyInfoHieght;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}

			> .chart {
				height: 30px;
			}
		}
	}
}
</style>

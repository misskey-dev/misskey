<template>
<x-column>
	<span slot="header">
		%fa:hashtag%<span>{{ tag }}</span>
	</span>

	<div class="xroyrflcmhhtmlwmyiwpfqiirqokfueb">
		<div ref="chart" class="chart"></div>
		<x-hashtag-tl :tag-tl="tagTl" class="tl"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XHashtagTl from './deck.hashtag-tl.vue';
import * as G2 from '@antv/g2';
import * as tinycolor from 'tinycolor2';

export default Vue.extend({
	components: {
		XColumn,
		XHashtagTl
	},

	props: {
		tag: {
			type: String,
			required: true
		}
	},

	computed: {
		tagTl(): any {
			return {
				query: [[this.tag]]
			};
		}
	},

	mounted() {
		(this as any).api('charts/hashtag', {
			tag: this.tag,
			span: 'hour',
			limit: 30
		}).then(stats => {
			const data = [];

			const now = new Date();
			const y = now.getFullYear();
			const m = now.getMonth();
			const d = now.getDate();
			const h = now.getHours();

			for (let i = 0; i < 30; i++) {
				const x = new Date(y, m, d, h - i + 1);
				data.push({
					x: x,
					count: stats.count[i]
				});
			}

			const chart = new G2.Chart({
				container: this.$refs.chart as HTMLDivElement,
				forceFit: true,
				height: 70,
				padding: 8,
				renderer: 'svg'
			});

			const text = tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--primary'));

			chart.area().position('x*count').color(`l(100) 0:${text.clone().setAlpha(0.5).toRgbString()} 1:${text.clone().setAlpha(0.25).toRgbString()}`);
			chart.line().position('x*count').color(`#${text.clone().toHex()}`).size(2);
			chart.legend(false);
			chart.axis('x', false);
			chart.axis('count', false);
			chart.tooltip(true, {
				showTitle: false,
				crosshairs: {
					type: 'line'
				}
			});
			chart.source(data);
			chart.render();
		});
	}
});
</script>

<style lang="stylus" scoped>
.xroyrflcmhhtmlwmyiwpfqiirqokfueb
	background var(--deckColumnBg)

	> .chart
		margin 16px 0
		background var(--face)

	> .tl
		background var(--face)

</style>

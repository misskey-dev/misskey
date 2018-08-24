import Vue from 'vue';
import { Line } from 'vue-chartjs';
import * as mergeOptions from 'merge-options';

export default Vue.extend({
	extends: Line,
	props: {
		data: {
			required: true
		},
		opts: {
			required: false
		}
	},
	watch: {
		data() {
			this.render();
		}
	},
	mounted() {
		this.render();
	},
	methods: {
		render() {
			this.renderChart(this.data, mergeOptions({
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					xAxes: [{
						type: 'time',
						distribution: 'series'
					}]
				},
				tooltips: {
					intersect: false,
					mode: 'x',
					position: 'nearest'
				}
			}, this.opts || {}));
		}
	}
});

import Vue from 'vue';
import { Line } from 'vue-chartjs';

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
			this.renderChart(this.data, Object.assign({
				responsive: false,
				scales: {
					xAxes: [{
						type: 'time',
						time: {
							displayFormats: {
								quarter: 'YYYY/MM/D h:mm'
							}
						},
						distribution: 'series'
					}]
				}
			}, this.opts || {}));
		}
	}
});

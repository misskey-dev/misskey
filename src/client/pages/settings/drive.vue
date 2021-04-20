<template>
<FormBase class="">
	<FormGroup v-if="!fetching">
		<template #label>{{ $ts.usageAmount }}</template>
		<div class="_formItem uawsfosz">
			<div class="_formPanel">
				<div class="meter"><div :style="meterStyle"></div></div>
			</div>
		</div>
		<FormKeyValueView>
			<template #key>{{ $ts.capacity }}</template>
			<template #value>{{ bytes(capacity, 1) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.inUse }}</template>
			<template #value>{{ bytes(usage, 1) }}</template>
		</FormKeyValueView>
	</FormGroup>

	<div class="_formItem">
		<div class="_formLabel">{{ $ts.statistics }}</div>
		<div class="_formPanel">
			<div ref="chart"></div>
		</div>
	</div>

	<FormButton :center="false" @click="chooseUploadFolder()" primary>
		{{ $ts.uploadFolder }}
		<template #suffix>{{ uploadFolder ? uploadFolder.name : '-' }}</template>
		<template #suffixIcon><i class="fas fa-folder-open"></i></template>
	</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as tinycolor from 'tinycolor2';
import ApexCharts from 'apexcharts';
import FormButton from '@client/components/form/button.vue';
import FormGroup from '@client/components/form/group.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import FormBase from '@client/components/form/base.vue';
import * as os from '@client/os';
import bytes from '@client/filters/bytes';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		FormGroup,
		FormKeyValueView,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.drive,
				icon: 'fas fa-cloud'
			},
			fetching: true,
			usage: null,
			capacity: null,
			uploadFolder: null,
		}
	},

	computed: {
		meterStyle(): any {
			return {
				width: `${this.usage / this.capacity * 100}%`,
				background: tinycolor({
					h: 180 - (this.usage / this.capacity * 180),
					s: 0.7,
					l: 0.5
				})
			};
		}
	},

	async created() {
		os.api('drive').then(info => {
			this.capacity = info.capacity;
			this.usage = info.usage;
			this.fetching = false;
			this.$nextTick(() => {
				this.renderChart();
			});
		});

		if (this.$store.state.uploadFolder) {
			this.uploadFolder = await os.api('drive/folders/show', {
				folderId: this.$store.state.uploadFolder
			});
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		chooseUploadFolder() {
			os.selectDriveFolder(false).then(async folder => {
				this.$store.set('uploadFolder', folder ? folder.id : null);
				os.success();
				if (this.$store.state.uploadFolder) {
					this.uploadFolder = await os.api('drive/folders/show', {
						folderId: this.$store.state.uploadFolder
					});
				} else {
					this.uploadFolder = null;
				}
			});
		},

		renderChart() {
			os.api('charts/user/drive', {
				userId: this.$i.id,
				span: 'day',
				limit: 21
			}).then(stats => {
				const addition = [];
				const deletion = [];
				const now = new Date();
				const y = now.getFullYear();
				const m = now.getMonth();
				const d = now.getDate();
				for (let i = 0; i < 21; i++) {
					const x = new Date(y, m, d - i);
					addition.push([
						x,
						stats.incSize[i]
					]);
					deletion.push([
						x,
						-stats.decSize[i]
					]);
				}
				const chart = new ApexCharts(this.$refs.chart, {
					chart: {
						type: 'bar',
						stacked: true,
						height: 150,
						toolbar: {
							show: false
						},
						zoom: {
							enabled: false
						}
					},
					plotOptions: {
						bar: {
							columnWidth: '80%'
						}
					},
					grid: {
						clipMarkers: false,
						borderColor: 'rgba(0, 0, 0, 0.1)',
						xaxis: {
							lines: {
								show: true,
							}
						},
					},
					tooltip: {
						shared: true,
						intersect: false,
						theme: this.$store.state.darkMode ? 'dark' : 'light',
					},
					dataLabels: {
						enabled: false
					},
					legend: {
						show: false
					},
					series: [{
						name: 'Additions',
						data: addition
					}, {
						name: 'Deletions',
						data: deletion
					}],
					xaxis: {
						type: 'datetime',
						labels: {
							style: {
								colors: tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--fg')).toRgbString()
							}
						},
						axisBorder: {
							color: 'rgba(0, 0, 0, 0.1)'
						},
						axisTicks: {
							color: 'rgba(0, 0, 0, 0.1)'
						},
						crosshairs: {
							width: 1,
							opacity: 1
						}
					},
					yaxis: {
						labels: {
							formatter: v => bytes(v, 0),
							style: {
								colors: tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--fg')).toRgbString()
							}
						}
					}
				});
				chart.render();
			});
		},

		bytes
	}
});
</script>

<style lang="scss" scoped>
.uawsfosz {
	> div {
		padding: 24px;

		> .meter {
			$size: 12px;
			background: rgba(0, 0, 0, 0.1);
			border-radius: ($size / 2);
			overflow: hidden;

			> div {
				height: $size;
				border-radius: ($size / 2);
			}
		}
	}
}
</style>

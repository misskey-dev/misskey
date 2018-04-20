<template>
<div class="mk-activity">
	<mk-widget-container :show-header="design == 0" :naked="design == 2">
		<template slot="header">%fa:chart-bar%%i18n:@title%</template>
		<button slot="func" title="%i18n:@toggle%" @click="toggle">%fa:sort%</button>

		<p :class="$style.fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
		<template v-else>
			<x-calendar v-show="view == 0" :data="[].concat(activity)"/>
			<x-chart v-show="view == 1" :data="[].concat(activity)"/>
		</template>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCalendar from './activity.calendar.vue';
import XChart from './activity.chart.vue';

export default Vue.extend({
	components: {
		XCalendar,
		XChart
	},
	props: {
		design: {
			default: 0
		},
		initView: {
			default: 0
		},
		user: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			fetching: true,
			activity: null,
			view: this.initView
		};
	},
	mounted() {
		(this as any).api('aggregation/users/activity', {
			userId: this.user.id,
			limit: 20 * 7
		}).then(activity => {
			this.activity = activity;
			this.fetching = false;
		});
	},
	methods: {
		toggle() {
			if (this.view == 1) {
				this.view = 0;
				this.$emit('viewChanged', this.view);
			} else {
				this.view++;
				this.$emit('viewChanged', this.view);
			}
		}
	}
});
</script>

<style lang="stylus" module>
.fetching
	margin 0
	padding 16px
	text-align center
	color #aaa

	> [data-fa]
		margin-right 4px

</style>

<template>
<div class="mk-activity" :data-melt="design == 2">
	<template v-if="design == 0">
		<p class="title">%fa:chart-bar%%i18n:desktop.tags.mk-activity-widget.title%</p>
		<button @click="toggle" title="%i18n:desktop.tags.mk-activity-widget.toggle%">%fa:sort%</button>
	</template>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<template v-else>
		<x-calendar v-show="view == 0" :data="[].concat(activity)"/>
		<x-chart v-show="view == 1" :data="[].concat(activity)"/>
	</template>
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
			user_id: this.user.id,
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

<style lang="stylus" scoped>
.mk-activity
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	&[data-melt]
		background transparent !important
		border none !important

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> [data-fa]
			margin-right 4px

	> button
		position absolute
		z-index 2
		top 0
		right 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color #ccc

		&:hover
			color #aaa

		&:active
			color #999

	> .fetching
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

</style>

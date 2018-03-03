<template>
<div class="mkw-calendar"
	:data-melt="props.design == 1"
	:data-special="special"
	:data-mobile="isMobile"
>
	<div class="calendar" :data-is-holiday="isHoliday">
		<p class="month-and-year">
			<span class="year">{{ year }}年</span>
			<span class="month">{{ month }}月</span>
		</p>
		<p class="day">{{ day }}日</p>
		<p class="week-day">{{ weekDay }}曜日</p>
	</div>
	<div class="info">
		<div>
			<p>今日:<b>{{ dayP.toFixed(1) }}%</b></p>
			<div class="meter">
				<div class="val" :style="{ width: `${dayP}%` }"></div>
			</div>
		</div>
		<div>
			<p>今月:<b>{{ monthP.toFixed(1) }}%</b></p>
			<div class="meter">
				<div class="val" :style="{ width: `${monthP}%` }"></div>
			</div>
		</div>
		<div>
			<p>今年:<b>{{ yearP.toFixed(1) }}%</b></p>
			<div class="meter">
				<div class="val" :style="{ width: `${yearP}%` }"></div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'calendar',
	props: () => ({
		design: 0
	})
}).extend({
	data() {
		return {
			now: new Date(),
			year: null,
			month: null,
			day: null,
			weekDay: null,
			yearP: null,
			dayP: null,
			monthP: null,
			isHoliday: null,
			special: null,
			clock: null
		};
	},
	created() {
		this.tick();
		this.clock = setInterval(this.tick, 1000);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		func() {
			if (this.isMobile) return;
			if (this.props.design == 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
		},
		tick() {
			const now = new Date();
			const nd = now.getDate();
			const nm = now.getMonth();
			const ny = now.getFullYear();

			this.year = ny;
			this.month = nm + 1;
			this.day = nd;
			this.weekDay = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];

			const dayNumer   = now.getTime() - new Date(ny, nm, nd).getTime();
			const dayDenom   = 1000/*ms*/ * 60/*s*/ * 60/*m*/ * 24/*h*/;
			const monthNumer = now.getTime() - new Date(ny, nm, 1).getTime();
			const monthDenom = new Date(ny, nm + 1, 1).getTime() - new Date(ny, nm, 1).getTime();
			const yearNumer  = now.getTime() - new Date(ny, 0, 1).getTime();
			const yearDenom  = new Date(ny + 1, 0, 1).getTime() - new Date(ny, 0, 1).getTime();

			this.dayP   = dayNumer   / dayDenom   * 100;
			this.monthP = monthNumer / monthDenom * 100;
			this.yearP  = yearNumer  / yearDenom  * 100;

			this.isHoliday = now.getDay() == 0 || now.getDay() == 6;

			this.special =
				nm == 0 && nd == 1 ? 'on-new-years-day' :
				false;
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mkw-calendar
	padding 16px 0
	color #777
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	&[data-special='on-new-years-day']
		border-color #ef95a0

	&[data-melt]
		background transparent
		border none

	&[data-mobile]
		border none
		border-radius 8px
		box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

	&:after
		content ""
		display block
		clear both

	> .calendar
		float left
		width 60%
		text-align center

		&[data-is-holiday]
			> .day
				color #ef95a0

		> p
			margin 0
			line-height 18px
			font-size 14px

			> span
				margin 0 4px

		> .day
			margin 10px 0
			line-height 32px
			font-size 28px

	> .info
		display block
		float left
		width 40%
		padding 0 16px 0 0

		> div
			margin-bottom 8px

			&:last-child
				margin-bottom 4px

			> p
				margin 0 0 2px 0
				font-size 12px
				line-height 18px
				color #888

				> b
					margin-left 2px

			> .meter
				width 100%
				overflow hidden
				background #eee
				border-radius 8px

				> .val
					height 4px
					background $theme-color

			&:nth-child(1)
				> .meter > .val
					background #f7796c

			&:nth-child(2)
				> .meter > .val
					background #a1de41

			&:nth-child(3)
				> .meter > .val
					background #41ddde

</style>

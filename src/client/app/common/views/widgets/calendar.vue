<template>
<div class="mkw-calendar" :data-special="special" :data-mobile="platform == 'mobile'">
	<ui-container :naked="props.design == 1" :show-header="false">
		<div class="mkw-calendar--body">
			<div class="calendar" :data-is-holiday="isHoliday">
				<p class="month-and-year">
					<span class="year">{{ this.$t('year').split('{}')[0] }}{{ year }}{{ this.$t('year').split('{}')[1] }}</span>
					<span class="month">{{ this.$t('month').split('{}')[0] }}{{ month }}{{ this.$t('month').split('{}')[1] }}</span>
				</p>
				<p class="day">{{ this.$t('day').split('{}')[0] }}{{ day }}{{ this.$t('day').split('{}')[1] }}</p>
				<p class="week-day">{{ weekDay }}</p>
			</div>
			<div class="info">
				<div>
					<p>{{ $t('today') }}<b>{{ dayP.toFixed(1) }}%</b></p>
					<div class="meter">
						<div class="val" :style="{ width: `${dayP}%` }"></div>
					</div>
				</div>
				<div>
					<p>{{ $t('this-month') }}<b>{{ monthP.toFixed(1) }}%</b></p>
					<div class="meter">
						<div class="val" :style="{ width: `${monthP}%` }"></div>
					</div>
				</div>
				<div>
					<p>{{ $t('this-year') }}<b>{{ yearP.toFixed(1) }}%</b></p>
					<div class="meter">
						<div class="val" :style="{ width: `${yearP}%` }"></div>
					</div>
				</div>
			</div>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'calendar',
	props: () => ({
		design: 0
	})
}).extend({
	i18n: i18n('common/views/widgets/calendar.vue'),
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
			if (this.platform == 'mobile') return;
			if (this.props.design == 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
			this.save();
		},
		tick() {
			const now = new Date();
			const nd = now.getDate();
			const nm = now.getMonth();
			const ny = now.getFullYear();

			this.year = ny;
			this.month = nm + 1;
			this.day = nd;
			this.weekDay = [
				this.$t('@.weekday.sunday'),
				this.$t('@.weekday.monday'),
				this.$t('@.weekday.tuesday'),
				this.$t('@.weekday.wednesday'),
				this.$t('@.weekday.thursday'),
				this.$t('@.weekday.friday'),
				this.$t('@.weekday.saturday')
			][now.getDay()];

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
.mkw-calendar
	&[data-special='on-new-years-day']
		border-color #ef95a0

	.mkw-calendar--body
		padding 16px 0
		color var(--calendarDay)

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
					color var(--text)
					opacity 0.8

					> b
						margin-left 2px

				> .meter
					width 100%
					overflow hidden
					background var(--materBg)
					border-radius 8px

					> .val
						height 4px
						background var(--primary)
						transition width .3s cubic-bezier(0.23, 1, 0.32, 1)

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

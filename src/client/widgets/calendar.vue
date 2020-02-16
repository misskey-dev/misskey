<template>
<div class="mkw-calendar" :class="{ _panel: props.design === 0 }">
	<div class="calendar" :data-is-holiday="isHoliday">
		<p class="month-and-year">
			<span class="year">{{ $t('yearX', { year }) }}</span>
			<span class="month">{{ $t('monthX', { month }) }}</span>
		</p>
		<p class="day">{{ $t('dayX', { day }) }}</p>
		<p class="week-day">{{ weekDay }}</p>
	</div>
	<div class="info">
		<div>
			<p>{{ $t('today') }}: <b>{{ dayP.toFixed(1) }}%</b></p>
			<div class="meter">
				<div class="val" :style="{ width: `${dayP}%` }"></div>
			</div>
		</div>
		<div>
			<p>{{ $t('thisMonth') }}: <b>{{ monthP.toFixed(1) }}%</b></p>
			<div class="meter">
				<div class="val" :style="{ width: `${monthP}%` }"></div>
			</div>
		</div>
		<div>
			<p>{{ $t('thisYear') }}: <b>{{ yearP.toFixed(1) }}%</b></p>
			<div class="meter">
				<div class="val" :style="{ width: `${yearP}%` }"></div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import define from './define';
import i18n from '../i18n';

export default define({
	name: 'calendar',
	props: () => ({
		design: 0
	})
}).extend({
	i18n,
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
				this.$t('_weekday.sunday'),
				this.$t('_weekday.monday'),
				this.$t('_weekday.tuesday'),
				this.$t('_weekday.wednesday'),
				this.$t('_weekday.thursday'),
				this.$t('_weekday.friday'),
				this.$t('_weekday.saturday')
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
		}
	}
});
</script>

<style lang="scss" scoped>
.mkw-calendar {
	padding: 16px 0;

	&:after {
		content: "";
		display: block;
		clear: both;
	}

	> .calendar {
		float: left;
		width: 60%;
		text-align: center;

		&[data-is-holiday] {
			> .day {
				color: #ef95a0;
			}
		}

		> p {
			margin: 0;
			line-height: 18px;
			font-size: 0.9em;

			> span {
				margin: 0 4px;
			}
		}

		> .day {
			margin: 10px 0;
			line-height: 32px;
			font-size: 1.75em;
		}
	}

	> .info {
		display: block;
		float: left;
		width: 40%;
		padding: 0 16px 0 0;
		box-sizing: border-box;

		> div {
			margin-bottom: 8px;

			&:last-child {
				margin-bottom: 4px;
			}

			> p {
				margin: 0 0 2px 0;
				font-size: 0.75em;
				line-height: 18px;
				opacity: 0.8;

				> b {
					margin-left: 2px;
				}
			}

			> .meter {
				width: 100%;
				overflow: hidden;
				background: var(--aupeazdm);
				border-radius: 8px;

				> .val {
					height: 4px;
					transition: width .3s cubic-bezier(0.23, 1, 0.32, 1);
				}
			}

			&:nth-child(1) {
				> .meter > .val {
					background: #f7796c;
				}
			}

			&:nth-child(2) {
				> .meter > .val {
					background: #a1de41;
				}
			}

			&:nth-child(3) {
				> .meter > .val {
					background: #41ddde;
				}
			}
		}
	}
}
</style>

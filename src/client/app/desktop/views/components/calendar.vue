<template>
<div class="mk-calendar" :data-melt="design == 4 || design == 5">
	<template v-if="design == 0 || design == 1">
		<button @click="prev" title="%i18n:@prev%">%fa:chevron-circle-left%</button>
		<p class="title">{{ '%i18n:@title%'.replace('{1}', year).replace('{2}', month) }}</p>
		<button @click="next" title="%i18n:@next%">%fa:chevron-circle-right%</button>
	</template>

	<div class="calendar">
		<template v-if="design == 0 || design == 2 || design == 4">
		<div class="weekday"
			v-for="(day, i) in Array(7).fill(0)"
			:data-today="year == today.getFullYear() && month == today.getMonth() + 1 && today.getDay() == i"
			:data-is-donichi="i == 0 || i == 6"
		>{{ weekdayText[i] }}</div>
		</template>
		<div v-for="n in paddingDays"></div>
		<div class="day" v-for="(day, i) in days"
			:data-today="isToday(i + 1)"
			:data-selected="isSelected(i + 1)"
			:data-is-out-of-range="isOutOfRange(i + 1)"
			:data-is-donichi="isDonichi(i + 1)"
			@click="go(i + 1)"
			:title="isOutOfRange(i + 1) ? null : '%i18n:@go%'"
		>
			<div>{{ i + 1 }}</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

const eachMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year) {
	return (year % 400 == 0) ? true :
		(year % 100 == 0) ? false :
			(year % 4 == 0) ? true :
				false;
}

export default Vue.extend({
	props: {
		design: {
			default: 0
		},
		start: {
			type: Date,
			required: false
		}
	},
	data() {
		return {
			today: new Date(),
			year: new Date().getFullYear(),
			month: new Date().getMonth() + 1,
			selected: new Date(),
			weekdayText: [
				'%i18n:common.weekday-short.sunday%',
				'%i18n:common.weekday-short.monday%',
				'%i18n:common.weekday-short.tuesday%',
				'%i18n:common.weekday-short.wednesday%',
				'%i18n:common.weekday-short.thursday%',
				'%i18n:common.weekday-short.friday%',
				'%i18n:common.weekday-short.saturday%'
			]
		};
	},
	computed: {
		paddingDays(): number {
			const date = new Date(this.year, this.month - 1, 1);
			return date.getDay();
		},
		days(): number {
			let days = eachMonthDays[this.month - 1];

			// うるう年なら+1日
			if (this.month == 2 && isLeapYear(this.year)) days++;

			return days;
		}
	},
	methods: {
		isToday(day) {
			return this.year == this.today.getFullYear() && this.month == this.today.getMonth() + 1 && day == this.today.getDate();
		},

		isSelected(day) {
			return this.year == this.selected.getFullYear() && this.month == this.selected.getMonth() + 1 && day == this.selected.getDate();
		},

		isOutOfRange(day) {
			const test = (new Date(this.year, this.month - 1, day)).getTime();
			return test > this.today.getTime() ||
				(this.start ? test < (this.start as any).getTime() : false);
		},

		isDonichi(day) {
			const weekday = (new Date(this.year, this.month - 1, day)).getDay();
			return weekday == 0 || weekday == 6;
		},

		prev() {
			if (this.month == 1) {
				this.year = this.year - 1;
				this.month = 12;
			} else {
				this.month--;
			}
		},

		next() {
			if (this.month == 12) {
				this.year = this.year + 1;
				this.month = 1;
			} else {
				this.month++;
			}
		},

		go(day) {
			if (this.isOutOfRange(day)) return;
			const date = new Date(this.year, this.month - 1, day, 23, 59, 59, 999);
			this.selected = date;
			this.$emit('chosen', this.selected);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	color isDark ? #c5ced6 : #777
	background isDark ? #282C37 : #fff
	border solid 1px rgba(#000, 0.075)
	border-radius 6px

	&[data-melt]
		background transparent !important
		border none !important

	> .title
		z-index 1
		margin 0
		padding 0 16px
		text-align center
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(#000, 0.07)

		> [data-fa]
			margin-right 4px

	> button
		position absolute
		z-index 2
		top 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color #ccc

		&:hover
			color #aaa

		&:active
			color #999

		&:first-of-type
			left 0

		&:last-of-type
			right 0

	> .calendar
		display flex
		flex-wrap wrap
		padding 16px

		*
			user-select none

		> div
			width calc(100% * (1/7))
			text-align center
			line-height 32px
			font-size 14px

			&.weekday
				color #19a2a9

				&[data-is-donichi]
					color #ef95a0

				&[data-today]
					box-shadow 0 0 0 1px #19a2a9 inset
					border-radius 6px

					&[data-is-donichi]
						box-shadow 0 0 0 1px #ef95a0 inset

			&.day
				cursor pointer
				color #777

				> div
					border-radius 6px

				&:hover > div
					background rgba(#000, 0.025)

				&:active > div
					background rgba(#000, 0.05)

				&[data-is-donichi]
					color #ef95a0

				&[data-is-out-of-range]
					cursor default
					color rgba(#777, 0.5)

					&[data-is-donichi]
						color rgba(#ef95a0, 0.5)

				&[data-selected]
					font-weight bold

					> div
						background rgba(#000, 0.025)

					&:active > div
						background rgba(#000, 0.05)

				&[data-today]
					> div
						color $theme-color-foreground
						background $theme-color

					&:hover > div
						background lighten($theme-color, 10%)

					&:active > div
						background darken($theme-color, 10%)

.mk-calendar[data-darkmode]
	root(true)

.mk-calendar:not([data-darkmode])
	root(false)

</style>

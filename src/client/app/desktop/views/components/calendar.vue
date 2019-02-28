<template>
<div class="mk-calendar" :data-melt="design == 4 || design == 5" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
	<template v-if="design == 0 || design == 1">
		<button @click="prev" :title="$t('prev')"><fa icon="chevron-circle-left"/></button>
		<p class="title">{{ $t('title', { year, month }) }}</p>
		<button @click="next" :title="$t('next')"><fa icon="chevron-circle-right"/></button>
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
			:title="isOutOfRange(i + 1) ? null : $t('go')"
		>
			<div>{{ i + 1 }}</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

const eachMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year) {
	return !(year & (year % 25 ? 3 : 15));
}

export default Vue.extend({
	i18n: i18n('desktop/views/components/calendar.vue'),
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
				this.$t('@.weekday-short.sunday'),
				this.$t('@.weekday-short.monday'),
				this.$t('@.weekday-short.tuesday'),
				this.$t('@.weekday-short.wednesday'),
				this.$t('@.weekday-short.thursday'),
				this.$t('@.weekday-short.friday'),
				this.$t('@.weekday-short.saturday')
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
.mk-calendar
	color var(--calendarDay)
	background var(--face)
	overflow hidden

	&.round
		border-radius 6px

	&.shadow
		box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

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
		color var(--faceHeaderText)
		background var(--faceHeader)
		box-shadow 0 var(--lineWidth) rgba(#000, 0.07)

		> [data-icon]
			margin-right 4px

	> button
		position absolute
		z-index 2
		top 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color var(--faceTextButton)

		&:hover
			color var(--faceTextButtonHover)

		&:active
			color var(--faceTextButtonActive)

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
				color var(--calendarWeek)

				&[data-is-donichi]
					color var(--calendarSaturdayOrSunday)

				&[data-today]
					box-shadow 0 0 0 var(--lineWidth) var(--calendarWeek) inset
					border-radius 6px

					&[data-is-donichi]
						box-shadow 0 0 0 var(--lineWidth) var(--calendarSaturdayOrSunday) inset

			&.day
				cursor pointer
				color var(--calendarDay)

				> div
					border-radius 6px

				&:hover > div
					background var(--faceClearButtonHover)

				&:active > div
					background var(--faceClearButtonActive)

				&[data-is-donichi]
					color var(--calendarSaturdayOrSunday)

				&[data-is-out-of-range]
					cursor default
					opacity 0.5

				&[data-selected]
					font-weight bold

					> div
						background var(--faceClearButtonHover)

					&:active > div
						background var(--faceClearButtonActive)

				&[data-today]
					> div
						color var(--primaryForeground)
						background var(--primary)

					&:hover > div
						background var(--primaryLighten10)

					&:active > div
						background var(--primaryDarken10)

</style>

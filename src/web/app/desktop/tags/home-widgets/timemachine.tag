<mk-timemachine-home-widget>
	<button onclick={ prev }><i class="fa fa-chevron-circle-left"></i></button>
	<p class="title">{ year }/{ month }</p>
	<button onclick={ next }><i class="fa fa-chevron-circle-right"></i></button>

	<div class="calendar">
		<div class="weekday" each={ day, i in Array(7).fill(0) }>{ weekdayText[i] }</div>
		<div each={ day, i in Array(paddingDays).fill(0) }></div>
		<div class="day" each={ day, i in Array(days).fill(0) } data-today={ isToday(i + 1) } onclick={ go.bind(null, i + 1) }>{ i + 1 }</div>
	</div>
	<style>
		:scope
			display block
			color #777
			background #fff

			> .title
				z-index 1
				margin 0
				padding 0 16px
				text-align center
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> i
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

				> div
					width calc(100% * (1/7))
					text-align center
					line-height 32px
					font-size 14px

					&.weekday
						color #19a2a9

					&.day
						cursor pointer

						&:hover
							background rgba(0, 0, 0, 0.025)

						&:active
							background rgba(0, 0, 0, 0.05)

						&[data-today]
							color $theme-color-foreground
							background $theme-color

							&:hover
								background lighten($theme-color, 10%)

							&:active
								background darken($theme-color, 10%)

	</style>
	<script>
		const eachMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		function isLeapYear(year) {
			return (year % 400 == 0) ? true :
				(year % 100 == 0) ? false :
					(year % 4 == 0) ? true :
						false;
		}

		this.today = new Date();
		this.year = this.today.getFullYear();
		this.month = this.today.getMonth() + 1;
		this.weekdayText = [
			'%i18n:common.weekday-short.sunday%',
			'%i18n:common.weekday-short.monday%',
			'%i18n:common.weekday-short.tuesday%',
			'%i18n:common.weekday-short.wednesday%',
			'%i18n:common.weekday-short.thursday%',
			'%i18n:common.weekday-short.friday%',
			'%i18n:common.weekday-short.satruday%'
		];

		this.on('mount', () => {
			this.calc();
		});

		this.isToday = day => {
			return this.year == this.today.getFullYear() && this.month == this.today.getMonth() + 1 && day == this.today.getDate();
		};

		this.calc = () => {
			let days = eachMonthDays[this.month - 1];

			// うるう年なら+1日
			if (this.month == 2 && isLeapYear(this.year)) days++;

			const date = new Date(this.year, this.month - 1, 1);
			const weekday = date.getDay();

			this.update({
				paddingDays: weekday,
				days: days
			});
		};

		this.prev = () => {
			if (this.month == 1) {
				this.update({
					year: this.year - 1,
					month: 12
				});
			} else {
				this.update({
					month: this.month - 1
				});
			}
			this.calc();
		};

		this.next = () => {
			if (this.month == 12) {
				this.update({
					year: this.year + 1,
					month: 1
				});
			} else {
				this.update({
					month: this.month + 1
				});
			}
			this.calc();
		};

		this.go = day => {
			this.opts.tl.warp(new Date(this.year, this.month - 1, day, 23, 59, 59, 999));
		};
</script>
</mk-timemachine-home-widget>

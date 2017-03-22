<mk-time>
	<time datetime={ opts.time }>
		<span if={ mode == 'relative' }>{ relative }</span>
		<span if={ mode == 'absolute' }>{ absolute }</span>
		<span if={ mode == 'detail' }>{ absolute } ({ relative })</span>
	</time>
	<script>
		this.time = new Date(this.opts.time);
		this.mode = this.opts.mode || 'relative';
		this.tickid = null;

		this.absolute =
			this.time.getFullYear()    + '年' +
			(this.time.getMonth() + 1) + '月' +
			this.time.getDate()        + '日' +
			' ' +
			this.time.getHours()       + '時' +
			this.time.getMinutes()     + '分';

		this.on('mount', () => {
			if (this.mode == 'relative' || this.mode == 'detail') {
				this.tick();
				this.tickid = setInterval(this.tick, 1000);
			}
		});

		this.on('unmount', () => {
			if (this.mode === 'relative' || this.mode === 'detail') {
				clearInterval(this.tickid);
			}
		});

		this.tick = () => {
			const now = new Date();
			const ago = (now - this.time) / 1000/*ms*/;
			this.relative =
				ago >= 31536000 ? '%i18n:common.time.years_ago%'  .replace('{}', ~~(ago / 31536000)) :
				ago >= 2592000  ? '%i18n:common.time.months_ago%' .replace('{}', ~~(ago / 2592000)) :
				ago >= 604800   ? '%i18n:common.time.weeks_ago%'  .replace('{}', ~~(ago / 604800)) :
				ago >= 86400    ? '%i18n:common.time.days_ago%'   .replace('{}', ~~(ago / 86400)) :
				ago >= 3600     ? '%i18n:common.time.hours_ago%'  .replace('{}', ~~(ago / 3600)) :
				ago >= 60       ? '%i18n:common.time.minutes_ago%'.replace('{}', ~~(ago / 60)) :
				ago >= 10       ? '%i18n:common.time.seconds_ago%'.replace('{}', ~~(ago % 60)) :
				ago >= 0        ? '%i18n:common.time.just_now%' :
				ago <  0        ? '%i18n:common.time.future%' :
				'%i18n:common.time.unknown%';
			this.update();
		};
	</script>
</mk-time>

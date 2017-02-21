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
			this.time.getFullYear()  + '年' +
			this.time.getMonth() + 1 + '月' +
			this.time.getDate()      + '日' +
			' ' +
			this.time.getHours()     + '時' +
			this.time.getMinutes()   + '分';

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
				ago >= 31536000 ? ~~(ago / 31536000) + '年前' :
				ago >= 2592000  ? ~~(ago / 2592000)  + 'ヶ月前' :
				ago >= 604800   ? ~~(ago / 604800)   + '週間前' :
				ago >= 86400    ? ~~(ago / 86400)    + '日前' :
				ago >= 3600     ? ~~(ago / 3600)     + '時間前' :
				ago >= 60       ? ~~(ago / 60)       + '分前' :
				ago >= 10       ? ~~(ago % 60)       + '秒前' :
				ago >= 0        ?                      'たった今' :
				ago <  0        ?                      '未来' :
				                                       'なぞのじかん';
			this.update();
		};
	</script>
</mk-time>

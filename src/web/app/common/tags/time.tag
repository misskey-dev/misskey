<mk-time>
	<time datetime={ opts.time }><span if={ mode == 'relative' }>{ relative }</span><span if={ mode == 'absolute' }>{ absolute }</span><span if={ mode == 'detail' }>{ absolute } ({ relative })</span></time>
	<script>
		this.time = new Date this.opts.time
		this.mode = this.opts.mode || 'relative' 
		this.tickid = null

		this.absolute = 
			this.time.getFullYear() + '年' +
			this.time.getMonth() + 1 + '月' +
			this.time.getDate()      + '日' +
			' ' +
			this.time.getHours()     + '時' +
			this.time.getMinutes()   + '分' 

		this.on('mount', () => {
			if this.mode == 'relative' or this.mode == 'detail' 
				this.tick!
				this.tickid = setInterval this.tick, 1000ms

		this.on('unmount', () => {
			if this.mode == 'relative' or this.mode == 'detail' 
				clearInterval this.tickid

		this.tick = () => {
			const now = new Date();
			ago = (now - this.time) / 1000ms
			this.relative = switch
				| ago >= 31536000s => ~~(ago / 31536000s) + '年前'
				| ago >= 2592000s  => ~~(ago / 2592000s)  + 'ヶ月前'
				| ago >= 604800s   => ~~(ago / 604800s)   + '週間前'
				| ago >= 86400s    => ~~(ago / 86400s)    + '日前'
				| ago >= 3600s     => ~~(ago / 3600s)     + '時間前'
				| ago >= 60s       => ~~(ago / 60s)       + '分前'
				| ago >= 10s       => ~~(ago % 60s)       + '秒前'
				| ago >= 0s        =>                       'たった今'
				| ago <  0s        =>                       '未来'
				| _                =>                       'なぞのじかん'
			this.update();
	</script>
</mk-time>

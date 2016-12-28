mk-time
	time(datetime={ opts.time })
		span(if={ mode == 'relative' }) { relative }
		span(if={ mode == 'absolute' }) { absolute }
		span(if={ mode == 'detail' }) { absolute } ({ relative })

script.
	@time = new Date @opts.time
	@mode = @opts.mode || \relative
	@tickid = null

	@absolute =
		@time.get-full-year! + \年 +
		@time.get-month!     + \月 +
		@time.get-date!      + \日 +
		' ' +
		@time.get-hours!     + \時 +
		@time.get-minutes!   + \分

	@on \mount ~>
		if @mode == \relative or @mode == \detail
			@tick!
			@tickid = set-interval @tick, 1000ms

	@on \unmount ~>
		if @mode == \relative or @mode == \detail
			clear-interval @tickid

	@tick = ~>
		now = new Date!
		ago = (now - @time) / 1000ms
		@relative = switch
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
		@update!

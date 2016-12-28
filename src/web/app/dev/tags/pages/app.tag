mk-app-page
	p(if={ fetching }) 読み込み中
	main(if={ !fetching })
		header
			h1 { app.name }
		div.body
			p App Secret
			input(value={ app.secret }, readonly)

style.
	display block

script.
	@mixin \api

	@fetching = true

	@on \mount ~>
		@api \app/show do
			app_id: @opts.app
		.then (app) ~>
			@app = app
			@fetching = false
			@update!

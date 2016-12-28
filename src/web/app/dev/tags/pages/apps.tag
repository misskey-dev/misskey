mk-apps-page
	h1 アプリを管理
	a(href='/app/new') アプリ作成
	div.apps
		p(if={ fetching }) 読み込み中
		virtual(if={ !fetching })
			p(if={ apps.length == 0 }) アプリなし
			ul(if={ apps.length > 0 })
				li(each={ app in apps })
					a(href={ '/app/' + app.id })
						p.name { app.name }

style.
	display block

script.
	@mixin \api

	@fetching = true

	@on \mount ~>
		@api \my/apps
		.then (apps) ~>
			@fetching = false
			@apps = apps
			@update!

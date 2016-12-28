mk-debugger
	mk-window@window(is-modal={ false }, width={ '700px' }, height={ '550px' })
		<yield to="header">
		i.fa.fa-wrench
		| Debugger
		</yield>
		<yield to="content">
		section.progress-dialog
			h1 progress-dialog
			button.style-normal(onclick={ parent.progress-dialog }): i.fa.fa-play
			button.style-normal(onclick={ parent.progress-dialog-destroy }): i.fa.fa-stop
			label
				p TITLE:
				input@progress-title(value='Title')
			label
				p VAL:
				input@progress-value(type='number', oninput={ parent.progress-change }, value=0)
			label
				p MAX:
				input@progress-max(type='number', oninput={ parent.progress-change }, value=100)
		</yield>

style.
	> mk-window
		[data-yield='header']
			> i
				margin-right 4px

		[data-yield='content']
			overflow auto

			> section
				padding 32px

				//	& + section
				//		margin-top 16px

				> h1
					display block
					margin 0
					padding 0 0 8px 0
					font-size 1em
					color #555
					border-bottom solid 1px #eee

				> label
					display block

					> p
						display inline
						margin 0

			> .progress-dialog
				button
					display inline-block
					margin 8px

script.
	@mixin \open-window

	@on \mount ~>
		@progress-title = @tags['mk-window'].progress-title
		@progress-value = @tags['mk-window'].progress-value
		@progress-max = @tags['mk-window'].progress-max

		@refs.window.on \closed ~>
			@unmount!

	################################

	@progress-controller = riot.observable!

	@progress-dialog = ~>
		@open-window \mk-progress-dialog do
			title: @progress-title.value
			value: @progress-value.value
			max: @progress-max.value
			controller: @progress-controller

	@progress-change = ~>
		@progress-controller.trigger do
			\update
			@progress-value.value
			@progress-max.value

	@progress-dialog-destroy = ~>
		@progress-controller.trigger \close

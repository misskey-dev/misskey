<mk-debugger>
	<mk-window ref="window" is-modal={ false } width={ '700px' } height={ '550px' }><yield to="header"><i class="fa fa-wrench"></i>Debugger</yield>
<yield to="content">
		<section class="progress-dialog">
			<h1>progress-dialog</h1>
			<button class="style-normal" onclick={ parent.progressDialog }><i class="fa fa-play"></i></button>
			<button class="style-normal" onclick={ parent.progressDialogDestroy }><i class="fa fa-stop"></i></button>
			<label>
				<p>TITLE:</p>
				<input ref="progressTitle" value="Title"/>
			</label>
			<label>
				<p>VAL:</p>
				<input ref="progressValue" type="number" oninput={ parent.progressChange } value="0"/>
			</label>
			<label>
				<p>MAX:</p>
				<input ref="progressMax" type="number" oninput={ parent.progressChange } value="100"/>
			</label>
		</section></yield>
	</mk-window>
	<style type="stylus">
		:scope
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

	</style>
	<script>
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
	</script>
</mk-debugger>

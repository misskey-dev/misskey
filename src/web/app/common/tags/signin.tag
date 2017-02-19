<mk-signin>
	<form class={ signing: signing } onsubmit={ onsubmit }>
		<label class="user-name">
			<input ref="username" type="text" pattern="^[a-zA-Z0-9-]+$" placeholder="ユーザー名" autofocus="autofocus" required="required" oninput={ oninput }/><i class="fa fa-at"></i>
		</label>
		<label class="password">
			<input ref="password" type="password" placeholder="パスワード" required="required"/><i class="fa fa-lock"></i>
		</label>
		<button type="submit" disabled={ signing }>{ signing ? 'やっています...' : 'サインイン' }</button>
	</form>
	<style>
		:scope
			display block

			> form
				display block
				z-index 2

				&.signing
					&, *
						cursor wait !important

				label
					display block
					margin 12px 0

					i
						display block
						pointer-events none
						position absolute
						bottom 0
						top 0
						left 0
						z-index 1
						margin auto
						padding 0 16px
						height 1em
						color #898786

					input[type=text]
					input[type=password]
						user-select text
						display inline-block
						cursor auto
						padding 0 0 0 38px
						margin 0
						width 100%
						line-height 44px
						font-size 1em
						color rgba(0, 0, 0, 0.7)
						background #fff
						outline none
						border solid 1px #eee
						border-radius 4px

						&:hover
							background rgba(255, 255, 255, 0.7)
							border-color #ddd

							& + i
								color #797776

						&:focus
							background #fff
							border-color #ccc

							& + i
								color #797776

				[type=submit]
					cursor pointer
					padding 16px
					margin -6px 0 0 0
					width 100%
					font-size 1.2em
					color rgba(0, 0, 0, 0.5)
					outline none
					border none
					border-radius 0
					background transparent
					transition all .5s ease

					&:hover
						color $theme-color
						transition all .2s ease

					&:focus
						color $theme-color
						transition all .2s ease

					&:active
						color darken($theme-color, 30%)
						transition all .2s ease

					&:disabled
						opacity 0.7

	</style>
	<script>
		@mixin \api

		@user = null
		@signing = false

		@oninput = ~>
			@api \users/show do
				username: @refs.username.value
			.then (user) ~>
				@user = user
				@trigger \user user
				@update!

		@onsubmit = (e) ~>
			e.prevent-default!

			if @refs.username.value == ''
				@refs.username.focus!
				return false
			if @refs.password.value == ''
				@refs.password.focus!
				return false

			@signing = true
			@update!

			@api \signin do
				username: @refs.username.value
				password: @refs.password.value
			.then ~>
				location.reload!
			.catch ~>
				alert 'something happened'
				@signing = false
				@update!

			false
	</script>
</mk-signin>

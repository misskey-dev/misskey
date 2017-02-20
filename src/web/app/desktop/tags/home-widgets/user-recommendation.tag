<mk-user-recommendation-home-widget>
	<p class="title"><i class="fa fa-users"></i>おすすめユーザー</p>
	<button onclick={ refresh } title="他を見る"><i class="fa fa-refresh"></i></button>
	<div class="user" if={ !loading && users.length != 0 } each={ _user in users }><a class="avatar-anchor" href={ CONFIG.url + '/' + _user.username }><img class="avatar" src={ _user.avatar_url + '?thumbnail&size=42' } alt="" data-user-preview={ _user.id }/></a>
		<div class="body"><a class="name" href={ CONFIG.url + '/' + _user.username } data-user-preview={ _user.id }>{ _user.name }</a>
			<p class="username">@{ _user.username }</p>
		</div>
		<mk-follow-button user={ _user }></mk-follow-button>
	</div>
	<p class="empty" if={ !loading && users.length == 0 }>いません！</p>
	<p class="loading" if={ loading }><i class="fa fa-spinner fa-pulse fa-fw"></i>読み込んでいます
		<mk-ellipsis></mk-ellipsis>
	</p>
	<style>
		:scope
			display block
			background #fff

			> .title
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				border-bottom solid 1px #eee

				> i
					margin-right 4px

			> button
				position absolute
				z-index 2
				top 0
				right 0
				padding 0
				width 42px
				font-size 0.9em
				line-height 42px
				color #ccc

				&:hover
					color #aaa

				&:active
					color #999

			> .user
				padding 16px
				border-bottom solid 1px #eee

				&:last-child
					border-bottom none

				&:after
					content ""
					display block
					clear both

				> .avatar-anchor
					display block
					float left
					margin 0 12px 0 0

					> .avatar
						display block
						width 42px
						height 42px
						margin 0
						border-radius 8px
						vertical-align bottom

				> .body
					float left
					width calc(100% - 54px)

					> .name
						margin 0
						font-size 16px
						line-height 24px
						color #555

					> .username
						display block
						margin 0
						font-size 15px
						line-height 16px
						color #ccc

				> mk-follow-button
					position absolute
					top 16px
					right 16px

			> .empty
				margin 0
				padding 16px
				text-align center
				color #aaa

			> .loading
				margin 0
				padding 16px
				text-align center
				color #aaa

				> i
					margin-right 4px

	</style>
	<script>
		this.mixin('api');
		this.mixin('user-preview');

		this.users = null
		this.loading = true

		this.limit = 3users
		this.page = 0

		this.on('mount', () => {
			@fetch!
			this.clock = setInterval =>
				if this.users.length < @limit
					@fetch true
			, 60000ms

		this.on('unmount', () => {
			clearInterval @clock

		this.fetch = (quiet = false) => {
			this.loading = true
			this.users = null
			if not quiet then this.update();
			this.api('users/recommendation', {
				limit: @limit
				offset: @limit * this.page
			}).then((users) => {
				this.loading = false
				this.users = users
				this.update();
			.catch (err, text-status) ->
				console.error err

		this.refresh = () => {
			if this.users.length < @limit
				this.page = 0
			else
				this.page++
			@fetch!
	</script>
</mk-user-recommendation-home-widget>

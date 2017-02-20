<mk-user>
	<div class="user" if={ !fetching }>
		<header>
			<div class="banner" style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=1024)' : '' }></div>
			<div class="body">
				<div class="top"><a class="avatar"><img src={ user.avatar_url + '?thumbnail&size=160' } alt="avatar"/></a>
					<mk-follow-button if={ SIGNIN && I.id != user.id } user={ user }></mk-follow-button>
				</div>
				<div class="title">
					<h1>{ user.name }</h1><span class="username">@{ user.username }</span><span class="followed" if={ user.is_followed }>フォローされています</span>
				</div>
				<div class="bio">{ user.bio }</div>
				<div class="info">
					<p class="location" if={ user.location }><i class="fa fa-map-marker"></i>{ user.location }</p>
					<p class="birthday" if={ user.birthday }><i class="fa fa-birthday-cake"></i>{ user.birthday.replace('-', '年').replace('-', '月') + '日' } ({ age(user.birthday) }歳)</p>
				</div>
				<div class="friends"><a href="{ user.username }/following"><b>{ user.following_count }</b><i>フォロー</i></a><a href="{ user.username }/followers"><b>{ user.followers_count }</b><i>フォロワー</i></a></div>
			</div>
			<nav><a data-is-active={ page == 'posts' } onclick={ goPosts }>投稿</a><a data-is-active={ page == 'media' } onclick={ goMedia }>メディア</a><a data-is-active={ page == 'graphs' } onclick={ goGraphs }>グラフ</a><a data-is-active={ page == 'likes' } onclick={ goLikes }>いいね</a></nav>
		</header>
		<div class="body">
			<mk-user-timeline if={ page == 'posts' } user={ user }></mk-user-timeline>
			<mk-user-timeline if={ page == 'media' } user={ user } with-media={ true }></mk-user-timeline>
			<mk-user-graphs if={ page == 'graphs' } user={ user }></mk-user-graphs>
		</div>
	</div>
	<style>
		:scope
			display block

			> .user
				> header
					> .banner
						padding-bottom 33.3%
						background-color #f5f5f5
						background-size cover
						background-position center

					> .body
						padding 8px
						margin 0 auto
						max-width 600px

						> .top
							&:after
								content ''
								display block
								clear both

							> .avatar
								display block
								float left
								width 25%
								height 40px

								> img
									display block
									position absolute
									left -2px
									bottom -2px
									width 100%
									border 2px solid #fff
									border-radius 6px

									@media (min-width 500px)
										left -4px
										bottom -4px
										border 4px solid #fff
										border-radius 12px

							> mk-follow-button
								float right
								height 40px

						> .title
							margin 8px 0

							> h1
								margin 0
								line-height 22px
								font-size 20px
								color #222

							> .username
								display inline-block
								line-height 20px
								font-size 16px
								font-weight bold
								color #657786

							> .followed
								margin-left 8px
								padding 2px 4px
								font-size 12px
								color #657786
								background #f8f8f8
								border-radius 4px

						> .bio
							margin 8px 0
							color #333

						> .info
							margin 8px 0

							> p
								display inline
								margin 0 16px 0 0
								color #555

								> i
									margin-right 4px

						> .friends
							> a
								color #657786

								&:first-child
									margin-right 16px

								> b
									margin-right 4px
									font-size 16px
									color #14171a

								> i
									font-size 14px

					> nav
						display flex
						justify-content center
						margin 0 auto
						max-width 600px
						border-bottom solid 1px #ddd

						> a
							display block
							flex 1 1
							text-align center
							line-height 52px
							font-size 14px
							text-decoration none
							color #657786
							border-bottom solid 2px transparent

							&[data-is-active]
								font-weight bold
								color $theme-color
								border-color $theme-color

				> .body
					@media (min-width 500px)
						padding 16px 0 0 0

	</style>
	<script>
		this.age = require 's-age' 

		this.mixin('i');
		this.mixin('api');

		this.username = this.opts.user
		this.page = if this.opts.page? then this.opts.page else 'posts' 
		this.fetching = true

		this.on('mount', () => {
			this.api 'users/show' do
				username: this.username
			.then (user) =>
				this.fetching = false
				this.user = user
				this.trigger 'loaded' user
				this.update();

		this.go-posts = () => {
			this.page = 'posts' 
			this.update();

		this.go-media = () => {
			this.page = 'media' 
			this.update();

		this.go-graphs = () => {
			this.page = 'graphs' 
			this.update();

		this.go-likes = () => {
			this.page = 'likes' 
			this.update();
	</script>
</mk-user>

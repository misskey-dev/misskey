<mk-user>
	<div class="user" if={ !fetching }>
		<header>
			<mk-user-header user={ user }/>
		</header>
		<mk-user-home if={ page == 'home' } user={ user }/>
		<mk-user-graphs if={ page == 'graphs' } user={ user }/>
	</div>
	<style>
		:scope
			display block

			> .user
				> header
					> mk-user-header
						overflow hidden

	</style>
	<script>
		this.mixin('api');

		this.username = this.opts.user;
		this.page = this.opts.page ? this.opts.page : 'home';
		this.fetching = true;
		this.user = null;

		this.on('mount', () => {
			this.api('users/show', {
				username: this.username
			}).then(user => {
				this.update({
					fetching: false,
					user: user
				});
				this.trigger('loaded');
			});
		});
	</script>
</mk-user>

<mk-user-header data-is-dark-background={ user.banner_url != null }>
	<div class="banner-container" style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=2048)' : '' }>
		<div class="banner" ref="banner" style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=2048)' : '' } onclick={ onUpdateBanner }></div>
	</div>
	<div class="fade"></div>
	<div class="container">
		<img class="avatar" src={ user.avatar_url + '?thumbnail&size=150' } alt="avatar"/>
		<div class="title">
			<p class="name" href={ '/' + user.username }>{ user.name }</p>
			<p class="username">@{ user.username }</p>
			<p class="location" if={ user.profile.location }><i class="fa fa-map-marker"></i>{ user.profile.location }</p>
		</div>
		<footer>
			<a href={ '/' + user.username } data-active>概要</a>
			<a href={ '/' + user.username + '/media' }>メディア</a>
			<a href={ '/' + user.username + '/graphs' }>グラフ</a>
		</footer>
	</div>
	<style>
		:scope
			$banner-height = 320px
			$footer-height = 58px

			display block
			background #f7f7f7
			box-shadow 0 1px 1px rgba(0, 0, 0, 0.075)

			&[data-is-dark-background]
				> .banner-container
					> .banner
						background-color #383838

				> .fade
					background linear-gradient(transparent, rgba(0, 0, 0, 0.7))

				> .container
					> .title
						color #fff

						> .name
							text-shadow 0 0 8px #000

			> .banner-container
				height $banner-height
				overflow hidden
				background-size cover
				background-position center

				> .banner
					height 100%
					background-color #f5f5f5
					background-size cover
					background-position center

			> .fade
				$fade-hight = 78px

				position absolute
				top ($banner-height - $fade-hight)
				left 0
				width 100%
				height $fade-hight

			> .container
				max-width 1200px
				margin 0 auto

				> .avatar
					display block
					position absolute
					bottom 16px
					left 16px
					z-index 2
					width 160px
					height 160px
					margin 0
					border solid 3px #fff
					border-radius 8px
					box-shadow 1px 1px 3px rgba(0, 0, 0, 0.2)

				> .title
					position absolute
					bottom $footer-height
					left 0
					width 100%
					padding 0 0 8px 195px
					color #656565
					font-family '游ゴシック', 'YuGothic', 'ヒラギノ角ゴ ProN W3', 'Hiragino Kaku Gothic ProN', 'Meiryo', 'メイリオ', sans-serif

					> .name
						display block
						margin 0
						line-height 40px
						font-weight bold
						font-size 2em

					> .username
					> .location
						display inline-block
						margin 0 16px 0 0
						line-height 20px
						opacity 0.8

						> i
							margin-right 4px

				> footer
					z-index 1
					height $footer-height
					padding-left 195px

					> a
						display inline-block
						margin 0
						padding 0 16px
						height $footer-height
						line-height $footer-height
						color #555

						&[data-active]
							border-bottom solid 4px $theme-color

					> button
						display block
						position absolute
						top 0
						right 0
						margin 8px
						padding 0
						width $footer-height - 16px
						line-height $footer-height - 16px - 2px
						font-size 1.2em
						color #777
						border solid 1px #eee
						border-radius 4px

						&:hover
							color #555
							border solid 1px #ddd

	</style>
	<script>
		import updateBanner from '../scripts/update-banner';

		this.mixin('i');

		this.user = this.opts.user;

		this.on('mount', () => {
			window.addEventListener('load', this.scroll);
			window.addEventListener('scroll', this.scroll);
			window.addEventListener('resize', this.scroll);
		});

		this.on('unmount', () => {
			window.removeEventListener('load', this.scroll);
			window.removeEventListener('scroll', this.scroll);
			window.removeEventListener('resize', this.scroll);
		});

		this.scroll = () => {
			const top = window.scrollY;

			const z = 1.25; // 奥行き(小さいほど奥)
			const pos = -(top / z);
			this.refs.banner.style.backgroundPosition = `center calc(50% - ${pos}px)`;

			const blur = top / 32
			if (blur <= 10) this.refs.banner.style.filter = `blur(${blur}px)`;
		};

		this.onUpdateBanner = () => {
			if (!this.SIGNIN || this.I.id != this.user.id) return;

			updateBanner(this.I, i => {
				this.user.banner_url = i.banner_url;
				this.update();
			});
		};
	</script>
</mk-user-header>

<mk-user-profile>
	<div class="friend-form" if={ SIGNIN && I.id != user.id }>
		<mk-big-follow-button user={ user }/>
		<p class="followed" if={ user.is_followed }>フォローされています</p>
	</div>
	<div class="description" if={ user.description }>{ user.description }</div>
	<div class="birthday" if={ user.profile.birthday }>
		<p><i class="fa fa-birthday-cake"></i>{ user.profile.birthday.replace('-', '年').replace('-', '月') + '日' } ({ age(user.profile.birthday) }歳)</p>
	</div>
	<div class="twitter" if={ user.twitter }>
		<p><i class="fa fa-twitter"></i><a href={ 'https://twitter.com/' + user.twitter.screen_name } target="_blank">@{ user.twitter.screen_name }</a></p>
	</div>
	<div class="status">
	  <p class="posts-count"><i class="fa fa-angle-right"></i><a>{ user.posts_count }</a><b>ポスト</b></p>
		<p class="following"><i class="fa fa-angle-right"></i><a onclick={ showFollowing }>{ user.following_count }</a>人を<b>フォロー</b></p>
		<p class="followers"><i class="fa fa-angle-right"></i><a onclick={ showFollowers }>{ user.followers_count }</a>人の<b>フォロワー</b></p>
	</div>
	<style>
		:scope
			display block
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> *:first-child
				border-top none !important

			> .friend-form
				padding 16px
				border-top solid 1px #eee

				> mk-big-follow-button
					width 100%

				> .followed
					margin 12px 0 0 0
					padding 0
					text-align center
					line-height 24px
					font-size 0.8em
					color #71afc7
					background #eefaff
					border-radius 4px

			> .description
				padding 16px
				color #555
				border-top solid 1px #eee

			> .birthday
				padding 16px
				color #555
				border-top solid 1px #eee

				> p
					margin 0

					> i
						margin-right 8px

			> .twitter
				padding 16px
				color #555
				border-top solid 1px #eee

				> p
					margin 0

					> i
						margin-right 8px

			> .status
				padding 16px
				color #555
				border-top solid 1px #eee

				> p
					margin 8px 0

					> i
						margin-left 8px
						margin-right 8px

	</style>
	<script>
		this.age = require('s-age');

		this.mixin('i');

		this.user = this.opts.user;

		this.showFollowing = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-user-following-window')), {
				user: this.user
			});
		};

		this.showFollowers = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-user-followers-window')), {
				user: this.user
			});
		};
	</script>
</mk-user-profile>

<mk-user-photos>
	<p class="title"><i class="fa fa-camera"></i>%i18n:desktop.tags.mk-user.photos.title%</p>
	<p class="initializing" if={ initializing }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:desktop.tags.mk-user.photos.loading%<mk-ellipsis/></p>
	<div class="stream" if={ !initializing && images.length > 0 }>
		<virtual each={ image in images }>
			<div class="img" style={ 'background-image: url(' + image.url + '?thumbnail&size=256)' }></div>
		</virtual>
	</div>
	<p class="empty" if={ !initializing && images.length == 0 }>%i18n:desktop.tags.mk-user.photos.no-photos%</p>
	<style>
		:scope
			display block
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> .title
				z-index 1
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> i
					margin-right 4px

			> .stream
				display -webkit-flex
				display -moz-flex
				display -ms-flex
				display flex
				justify-content center
				flex-wrap wrap
				padding 8px

				> .img
					flex 1 1 33%
					width 33%
					height 80px
					background-position center center
					background-size cover
					background-clip content-box
					border solid 2px transparent

			> .initializing
			> .empty
				margin 0
				padding 16px
				text-align center
				color #aaa

				> i
					margin-right 4px

	</style>
	<script>
		import isPromise from '../../common/scripts/is-promise';

		this.mixin('api');

		this.images = [];
		this.initializing = true;
		this.user = null;
		this.userPromise = isPromise(this.opts.user)
			? this.opts.user
			: Promise.resolve(this.opts.user);

		this.on('mount', () => {
			this.userPromise.then(user => {
				this.update({
					user: user
				});

				this.api('users/posts', {
					user_id: this.user.id,
					with_media: true,
					limit: 9
				}).then(posts => {
					this.initializing = false;
					posts.forEach(post => {
						post.media.forEach(media => {
							if (this.images.length < 9) this.images.push(media);
						});
					});
					this.update();
				});
			});
		});
	</script>
</mk-user-photos>

<mk-user-frequently-replied-users>
	<p class="title"><i class="fa fa-users"></i>%i18n:desktop.tags.mk-user.frequently-replied-users.title%</p>
	<p class="initializing" if={ initializing }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:desktop.tags.mk-user.frequently-replied-users.loading%<mk-ellipsis/></p>
	<div class="user" if={ !initializing && users.length != 0 } each={ _user in users }>
		<a class="avatar-anchor" href={ '/' + _user.username }>
			<img class="avatar" src={ _user.avatar_url + '?thumbnail&size=42' } alt="" data-user-preview={ _user.id }/>
		</a>
		<div class="body">
			<a class="name" href={ '/' + _user.username } data-user-preview={ _user.id }>{ _user.name }</a>
			<p class="username">@{ _user.username }</p>
		</div>
		<mk-follow-button user={ _user }/>
	</div>
	<p class="empty" if={ !initializing && users.length == 0 }>%i18n:desktop.tags.mk-user.frequently-replied-users.no-users%</p>
	<style>
		:scope
			display block
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> .title
				z-index 1
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> i
					margin-right 4px

			> .initializing
			> .empty
				margin 0
				padding 16px
				text-align center
				color #aaa

				> i
					margin-right 4px

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

	</style>
	<script>
		this.mixin('api');

		this.user = this.opts.user;
		this.initializing = true;

		this.on('mount', () => {
			this.api('users/get_frequently_replied_users', {
				user_id: this.user.id,
				limit: 4
			}).then(docs => {
				this.update({
					users: docs.map(doc => doc.user),
					initializing: false
				});
			});
		});
	</script>
</mk-user-frequently-replied-users>

<mk-user-followers-you-know>
	<p class="title"><i class="fa fa-users"></i>%i18n:desktop.tags.mk-user.followers-you-know.title%</p>
	<p class="initializing" if={ initializing }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:desktop.tags.mk-user.followers-you-know.loading%<mk-ellipsis/></p>
	<div if={ !initializing && users.length > 0 }>
	<virtual each={ user in users }>
		<a href={ '/' + user.username }><img src={ user.avatar_url + '?thumbnail&size=64' } alt={ user.name }/></a>
	</virtual>
	</div>
	<p class="empty" if={ !initializing && users.length == 0 }>%i18n:desktop.tags.mk-user.followers-you-know.no-users%</p>
	<style>
		:scope
			display block
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> .title
				z-index 1
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> i
					margin-right 4px

			> div
				padding 8px

				> a
					display inline-block
					margin 4px

					> img
						width 48px
						height 48px
						vertical-align bottom
						border-radius 100%

			> .initializing
			> .empty
				margin 0
				padding 16px
				text-align center
				color #aaa

				> i
					margin-right 4px

	</style>
	<script>
		this.mixin('api');

		this.user = this.opts.user;
		this.initializing = true;

		this.on('mount', () => {
			this.api('users/followers', {
				user_id: this.user.id,
				iknow: true,
				limit: 16
			}).then(x => {
				this.update({
					users: x.users,
					initializing: false
				});
			});
		});
	</script>
</mk-user-followers-you-know>

<mk-user-home>
	<div>
		<mk-user-profile user={ user }/>
		<mk-user-photos user={ user }/>
		<mk-user-followers-you-know if={ SIGNIN && I.id !== user.id } user={ user }/>
	</div>
	<main>
		<mk-post-detail if={ user.pinned_post } post={ user.pinned_post } compact={ true }/>
		<mk-user-timeline ref="tl" user={ user }/>
	</main>
	<div>
		<mk-calendar-widget warp={ warp } start={ new Date(user.created_at) }/>
		<mk-activity-widget user={ user }/>
		<mk-user-frequently-replied-users user={ user }/>
	</div>
	<style>
		:scope
			display flex
			justify-content center
			margin 0 auto
			max-width 1200px

			> *
				> *:not(:last-child)
					margin-bottom 16px

			> main
				padding 16px
				width calc(100% - 275px * 2)

				> mk-user-timeline
					border solid 1px rgba(0, 0, 0, 0.075)
					border-radius 6px

			> div
				width 275px
				margin 0

				&:first-child
					padding 16px 0 16px 16px

				&:last-child
					padding 16px 16px 16px 0

	</style>
	<script>
		this.mixin('i');

		this.user = this.opts.user;

		this.on('mount', () => {
			this.refs.tl.on('loaded', () => {
				this.trigger('loaded');
			});
		});

		this.warp = date => {
			this.refs.tl.warp(date);
		};
	</script>
</mk-user-home>

<mk-user-graphs>
	<section>
		<h1>投稿</h1>
		<mk-user-posts-graph user={ opts.user }/>
	</section>
	<section>
		<h1>フォロー/フォロワー</h1>
		<mk-user-friends-graph user={ opts.user }/>
	</section>
	<section>
		<h1>いいね</h1>
		<mk-user-likes-graph user={ opts.user }/>
	</section>
	<style>
		:scope
			display block

			> section
				margin 16px 0
				background #fff
				border solid 1px rgba(0, 0, 0, 0.1)
				border-radius 4px

				> h1
					margin 0 0 8px 0
					padding 0 16px
					line-height 40px
					font-size 1em
					color #666
					border-bottom solid 1px #eee

				> *:not(h1)
					margin 0 auto 16px auto

	</style>
	<script>
		this.on('mount', () => {
			this.trigger('loaded');
		});
	</script>
</mk-user-graphs>

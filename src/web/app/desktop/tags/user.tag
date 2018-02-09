<mk-user>
	<div class="user" v-if="!fetching">
		<header>
			<mk-user-header user={ user }/>
		</header>
		<mk-user-home v-if="page == 'home'" user={ user }/>
		<mk-user-graphs v-if="page == 'graphs'" user={ user }/>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block

			> .user
				> header
					> mk-user-header
						overflow hidden

	</style>
	<script lang="typescript">
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
				this.$emit('loaded');
			});
		});
	</script>
</mk-user>

<mk-user-header data-is-dark-background={ user.banner_url != null }>
	<div class="banner-container" style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=2048)' : '' }>
		<div class="banner" ref="banner" style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=2048)' : '' } @click="onUpdateBanner"></div>
	</div>
	<div class="fade"></div>
	<div class="container">
		<img class="avatar" src={ user.avatar_url + '?thumbnail&size=150' } alt="avatar"/>
		<div class="title">
			<p class="name" href={ '/' + user.username }>{ user.name }</p>
			<p class="username">@{ user.username }</p>
			<p class="location" v-if="user.profile.location">%fa:map-marker%{ user.profile.location }</p>
		</div>
		<footer>
			<a href={ '/' + user.username } data-active={ parent.page == 'home' }>%fa:home%概要</a>
			<a href={ '/' + user.username + '/media' } data-active={ parent.page == 'media' }>%fa:image%メディア</a>
			<a href={ '/' + user.username + '/graphs' } data-active={ parent.page == 'graphs' }>%fa:chart-bar%グラフ</a>
		</footer>
	</div>
	<style lang="stylus" scoped>
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

						> i
							margin-right 6px

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
	<script lang="typescript">
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
			this.$refs.banner.style.backgroundPosition = `center calc(50% - ${pos}px)`;

			const blur = top / 32
			if (blur <= 10) this.$refs.banner.style.filter = `blur(${blur}px)`;
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
	<div class="friend-form" v-if="SIGNIN && I.id != user.id">
		<mk-big-follow-button user={ user }/>
		<p class="followed" v-if="user.is_followed">%i18n:desktop.tags.mk-user.follows-you%</p>
		<p v-if="user.is_muted">%i18n:desktop.tags.mk-user.muted% <a @click="unmute">%i18n:desktop.tags.mk-user.unmute%</a></p>
		<p v-if="!user.is_muted"><a @click="mute">%i18n:desktop.tags.mk-user.mute%</a></p>
	</div>
	<div class="description" v-if="user.description">{ user.description }</div>
	<div class="birthday" v-if="user.profile.birthday">
		<p>%fa:birthday-cake%{ user.profile.birthday.replace('-', '年').replace('-', '月') + '日' } ({ age(user.profile.birthday) }歳)</p>
	</div>
	<div class="twitter" v-if="user.twitter">
		<p>%fa:B twitter%<a href={ 'https://twitter.com/' + user.twitter.screen_name } target="_blank">@{ user.twitter.screen_name }</a></p>
	</div>
	<div class="status">
	  <p class="posts-count">%fa:angle-right%<a>{ user.posts_count }</a><b>ポスト</b></p>
		<p class="following">%fa:angle-right%<a @click="showFollowing">{ user.following_count }</a>人を<b>フォロー</b></p>
		<p class="followers">%fa:angle-right%<a @click="showFollowers">{ user.followers_count }</a>人の<b>フォロワー</b></p>
	</div>
	<style lang="stylus" scoped>
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
	<script lang="typescript">
		this.age = require('s-age');

		this.mixin('i');
		this.mixin('api');

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

		this.mute = () => {
			this.api('mute/create', {
				user_id: this.user.id
			}).then(() => {
				this.user.is_muted = true;
				this.update();
			}, e => {
				alert('error');
			});
		};

		this.unmute = () => {
			this.api('mute/delete', {
				user_id: this.user.id
			}).then(() => {
				this.user.is_muted = false;
				this.update();
			}, e => {
				alert('error');
			});
		};
	</script>
</mk-user-profile>

<mk-user-photos>
	<p class="title">%fa:camera%%i18n:desktop.tags.mk-user.photos.title%</p>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:desktop.tags.mk-user.photos.loading%<mk-ellipsis/></p>
	<div class="stream" v-if="!initializing && images.length > 0">
		<template each={ image in images }>
			<div class="img" style={ 'background-image: url(' + image.url + '?thumbnail&size=256)' }></div>
		</template>
	</div>
	<p class="empty" v-if="!initializing && images.length == 0">%i18n:desktop.tags.mk-user.photos.no-photos%</p>
	<style lang="stylus" scoped>
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
	<script lang="typescript">
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
	<p class="title">%fa:users%%i18n:desktop.tags.mk-user.frequently-replied-users.title%</p>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:desktop.tags.mk-user.frequently-replied-users.loading%<mk-ellipsis/></p>
	<div class="user" v-if="!initializing && users.length != 0" each={ _user in users }>
		<a class="avatar-anchor" href={ '/' + _user.username }>
			<img class="avatar" src={ _user.avatar_url + '?thumbnail&size=42' } alt="" data-user-preview={ _user.id }/>
		</a>
		<div class="body">
			<a class="name" href={ '/' + _user.username } data-user-preview={ _user.id }>{ _user.name }</a>
			<p class="username">@{ _user.username }</p>
		</div>
		<mk-follow-button user={ _user }/>
	</div>
	<p class="empty" v-if="!initializing && users.length == 0">%i18n:desktop.tags.mk-user.frequently-replied-users.no-users%</p>
	<style lang="stylus" scoped>
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
	<script lang="typescript">
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
	<p class="title">%fa:users%%i18n:desktop.tags.mk-user.followers-you-know.title%</p>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:desktop.tags.mk-user.followers-you-know.loading%<mk-ellipsis/></p>
	<div v-if="!initializing && users.length > 0">
	<template each={ user in users }>
		<a href={ '/' + user.username }><img src={ user.avatar_url + '?thumbnail&size=64' } alt={ user.name }/></a>
	</template>
	</div>
	<p class="empty" v-if="!initializing && users.length == 0">%i18n:desktop.tags.mk-user.followers-you-know.no-users%</p>
	<style lang="stylus" scoped>
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
	<script lang="typescript">
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
		<div ref="left">
			<mk-user-profile user={ user }/>
			<mk-user-photos user={ user }/>
			<mk-user-followers-you-know v-if="SIGNIN && I.id !== user.id" user={ user }/>
			<p>%i18n:desktop.tags.mk-user.last-used-at%: <b><mk-time time={ user.last_used_at }/></b></p>
		</div>
	</div>
	<main>
		<mk-post-detail v-if="user.pinned_post" post={ user.pinned_post } compact={ true }/>
		<mk-user-timeline ref="tl" user={ user }/>
	</main>
	<div>
		<div ref="right">
			<mk-calendar-widget warp={ warp } start={ new Date(user.created_at) }/>
			<mk-activity-widget user={ user }/>
			<mk-user-frequently-replied-users user={ user }/>
			<div class="nav"><mk-nav-links/></div>
		</div>
	</div>
	<style lang="stylus" scoped>
		:scope
			display flex
			justify-content center
			margin 0 auto
			max-width 1200px

			> main
			> div > div
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

				&:first-child > div
					padding 16px 0 16px 16px

					> p
						display block
						margin 0
						padding 0 12px
						text-align center
						font-size 0.8em
						color #aaa

				&:last-child > div
					padding 16px 16px 16px 0

					> .nav
						padding 16px
						font-size 12px
						color #aaa
						background #fff
						border solid 1px rgba(0, 0, 0, 0.075)
						border-radius 6px

						a
							color #999

						i
							color #ccc

	</style>
	<script lang="typescript">
		import ScrollFollower from '../scripts/scroll-follower';

		this.mixin('i');

		this.user = this.opts.user;

		this.on('mount', () => {
			this.$refs.tl.on('loaded', () => {
				this.$emit('loaded');
			});

			this.scrollFollowerLeft = new ScrollFollower(this.$refs.left, this.parent.root.getBoundingClientRect().top);
			this.scrollFollowerRight = new ScrollFollower(this.$refs.right, this.parent.root.getBoundingClientRect().top);
		});

		this.on('unmount', () => {
			this.scrollFollowerLeft.dispose();
			this.scrollFollowerRight.dispose();
		});

		this.warp = date => {
			this.$refs.tl.warp(date);
		};
	</script>
</mk-user-home>

<mk-user-graphs>
	<section>
		<div>
			<h1>%fa:pencil-alt%投稿</h1>
			<mk-user-graphs-activity-chart user={ opts.user }/>
		</div>
	</section>
	<section>
		<div>
			<h1>フォロー/フォロワー</h1>
			<mk-user-friends-graph user={ opts.user }/>
		</div>
	</section>
	<section>
		<div>
			<h1>いいね</h1>
			<mk-user-likes-graph user={ opts.user }/>
		</div>
	</section>
	<style lang="stylus" scoped>
		:scope
			display block

			> section
				margin 16px 0
				color #666
				border-bottom solid 1px rgba(0, 0, 0, 0.1)

				> div
					max-width 1200px
					margin 0 auto
					padding 0 16px

					> h1
						margin 0 0 16px 0
						padding 0
						font-size 1.3em

						> i
							margin-right 8px

	</style>
	<script lang="typescript">
		this.on('mount', () => {
			this.$emit('loaded');
		});
	</script>
</mk-user-graphs>

<mk-user-graphs-activity-chart>
	<svg v-if="data" ref="canvas" viewBox="0 0 365 1" preserveAspectRatio="none">
		<g each={ d, i in data.reverse() }>
			<rect width="0.8" riot-height={ d.postsH }
				riot-x={ i + 0.1 } riot-y={ 1 - d.postsH - d.repliesH - d.repostsH }
				fill="#41ddde"/>
			<rect width="0.8" riot-height={ d.repliesH }
				riot-x={ i + 0.1 } riot-y={ 1 - d.repliesH - d.repostsH }
				fill="#f7796c"/>
			<rect width="0.8" riot-height={ d.repostsH }
				riot-x={ i + 0.1 } riot-y={ 1 - d.repostsH }
				fill="#a1de41"/>
			</g>
	</svg>
	<p>直近1年間分の統計です。一番右が現在で、一番左が1年前です。青は通常の投稿、赤は返信、緑はRepostをそれぞれ表しています。</p>
	<p>
		<span>だいたい*1日に<b>{ averageOfAllTypePostsEachDays }回</b>投稿(返信、Repost含む)しています。</span><br>
		<span>だいたい*1日に<b>{ averageOfPostsEachDays }回</b>投稿(通常の)しています。</span><br>
		<span>だいたい*1日に<b>{ averageOfRepliesEachDays }回</b>返信しています。</span><br>
		<span>だいたい*1日に<b>{ averageOfRepostsEachDays }回</b>Repostしています。</span><br>
	</p>
	<p>* 中央値</p>

	<style lang="stylus" scoped>
		:scope
			display block

			> svg
				display block
				width 100%
				height 180px

				> rect
					transform-origin center

	</style>
	<script lang="typescript">
		import getMedian from '../../common/scripts/get-median';

		this.mixin('api');

		this.user = this.opts.user;

		this.on('mount', () => {
			this.api('aggregation/users/activity', {
				user_id: this.user.id,
				limit: 365
			}).then(data => {
				data.forEach(d => d.total = d.posts + d.replies + d.reposts);
				this.peak = Math.max.apply(null, data.map(d => d.total));
				data.forEach(d => {
					d.postsH = d.posts / this.peak;
					d.repliesH = d.replies / this.peak;
					d.repostsH = d.reposts / this.peak;
				});

				this.update({
					data,
					averageOfAllTypePostsEachDays: getMedian(data.map(d => d.total)),
					averageOfPostsEachDays: getMedian(data.map(d => d.posts)),
					averageOfRepliesEachDays: getMedian(data.map(d => d.replies)),
					averageOfRepostsEachDays: getMedian(data.map(d => d.reposts))
				});
			});
		});
	</script>
</mk-user-graphs-activity-chart>

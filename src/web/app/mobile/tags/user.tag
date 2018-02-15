<mk-user>
	<div class="user" v-if="!fetching">
		<header>
			<div class="banner" style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=1024)' : '' }></div>
			<div class="body">
				<div class="top">
					<a class="avatar">
						<img src={ user.avatar_url + '?thumbnail&size=200' } alt="avatar"/>
					</a>
					<mk-follow-button v-if="SIGNIN && I.id != user.id" user={ user }/>
				</div>
				<div class="title">
					<h1>{ user.name }</h1>
					<span class="username">@{ user.username }</span>
					<span class="followed" v-if="user.is_followed">%i18n:mobile.tags.mk-user.follows-you%</span>
				</div>
				<div class="description">{ user.description }</div>
				<div class="info">
					<p class="location" v-if="user.profile.location">
						%fa:map-marker%{ user.profile.location }
					</p>
					<p class="birthday" v-if="user.profile.birthday">
						%fa:birthday-cake%{ user.profile.birthday.replace('-', '年').replace('-', '月') + '日' } ({ age(user.profile.birthday) }歳)
					</p>
				</div>
				<div class="status">
				  <a>
				    <b>{ user.posts_count }</b>
						<i>%i18n:mobile.tags.mk-user.posts%</i>
					</a>
					<a href="{ user.username }/following">
						<b>{ user.following_count }</b>
						<i>%i18n:mobile.tags.mk-user.following%</i>
					</a>
					<a href="{ user.username }/followers">
						<b>{ user.followers_count }</b>
						<i>%i18n:mobile.tags.mk-user.followers%</i>
					</a>
				</div>
			</div>
			<nav>
				<a data-is-active={ page == 'overview' } @click="go.bind(null, 'overview')">%i18n:mobile.tags.mk-user.overview%</a>
				<a data-is-active={ page == 'posts' } @click="go.bind(null, 'posts')">%i18n:mobile.tags.mk-user.timeline%</a>
				<a data-is-active={ page == 'media' } @click="go.bind(null, 'media')">%i18n:mobile.tags.mk-user.media%</a>
			</nav>
		</header>
		<div class="body">
			<mk-user-overview v-if="page == 'overview'" user={ user }/>
			<mk-user-timeline v-if="page == 'posts'" user={ user }/>
			<mk-user-timeline v-if="page == 'media'" user={ user } with-media={ true }/>
		</div>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block

			> .user
				> header
					box-shadow 0 4px 4px rgba(0, 0, 0, 0.3)

					> .banner
						padding-bottom 33.3%
						background-color #1b1b1b
						background-size cover
						background-position center

					> .body
						padding 12px
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
									border 2px solid #313a42
									border-radius 6px

									@media (min-width 500px)
										left -4px
										bottom -4px
										border 4px solid #313a42
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
								color #fff

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

						> .description
							margin 8px 0
							color #fff

						> .info
							margin 8px 0

							> p
								display inline
								margin 0 16px 0 0
								color #a9b9c1

								> i
									margin-right 4px

						> .status
							> a
								color #657786

								&:not(:last-child)
									margin-right 16px

								> b
									margin-right 4px
									font-size 16px
									color #fff

								> i
									font-size 14px

						> mk-activity-table
							margin 12px 0 0 0

					> nav
						display flex
						justify-content center
						margin 0 auto
						max-width 600px

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
					padding 8px

					@media (min-width 500px)
						padding 16px

	</style>
	<script lang="typescript">
		this.age = require('s-age');

		this.mixin('i');
		this.mixin('api');

		this.username = this.opts.user;
		this.page = this.opts.page ? this.opts.page : 'overview';
		this.fetching = true;

		this.on('mount', () => {
			this.$root.$data.os.api('users/show', {
				username: this.username
			}).then(user => {
				this.fetching = false;
				this.user = user;
				this.$emit('loaded', user);
				this.update();
			});
		});

		this.go = page => {
			this.update({
				page: page
			});
		};
	</script>
</mk-user>

<mk-user-overview>
	<mk-post-detail v-if="user.pinned_post" post={ user.pinned_post } compact={ true }/>
	<section class="recent-posts">
		<h2>%fa:R comments%%i18n:mobile.tags.mk-user-overview.recent-posts%</h2>
		<div>
			<mk-user-overview-posts user={ user }/>
		</div>
	</section>
	<section class="images">
		<h2>%fa:image%%i18n:mobile.tags.mk-user-overview.images%</h2>
		<div>
			<mk-user-overview-photos user={ user }/>
		</div>
	</section>
	<section class="activity">
		<h2>%fa:chart-bar%%i18n:mobile.tags.mk-user-overview.activity%</h2>
		<div>
			<mk-user-overview-activity-chart user={ user }/>
		</div>
	</section>
	<section class="keywords">
		<h2>%fa:R comment%%i18n:mobile.tags.mk-user-overview.keywords%</h2>
		<div>
			<mk-user-overview-keywords user={ user }/>
		</div>
	</section>
	<section class="domains">
		<h2>%fa:globe%%i18n:mobile.tags.mk-user-overview.domains%</h2>
		<div>
			<mk-user-overview-domains user={ user }/>
		</div>
	</section>
	<section class="frequently-replied-users">
		<h2>%fa:users%%i18n:mobile.tags.mk-user-overview.frequently-replied-users%</h2>
		<div>
			<mk-user-overview-frequently-replied-users user={ user }/>
		</div>
	</section>
	<section class="followers-you-know" v-if="SIGNIN && I.id !== user.id">
		<h2>%fa:users%%i18n:mobile.tags.mk-user-overview.followers-you-know%</h2>
		<div>
			<mk-user-overview-followers-you-know user={ user }/>
		</div>
	</section>
	<p>%i18n:mobile.tags.mk-user-overview.last-used-at%: <b><mk-time time={ user.last_used_at }/></b></p>
	<style lang="stylus" scoped>
		:scope
			display block
			max-width 600px
			margin 0 auto

			> mk-post-detail
				margin 0 0 8px 0

			> section
				background #eee
				border-radius 8px
				box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

				&:not(:last-child)
					margin-bottom 8px

				> h2
					margin 0
					padding 8px 10px
					font-size 15px
					font-weight normal
					color #465258
					background #fff
					border-radius 8px 8px 0 0

					> i
						margin-right 6px

			> .activity
				> div
					padding 8px

			> p
				display block
				margin 16px
				text-align center
				color #cad2da

	</style>
	<script lang="typescript">
		this.mixin('i');

		this.user = this.opts.user;
	</script>
</mk-user-overview>

<mk-user-overview-posts>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:mobile.tags.mk-user-overview-posts.loading%<mk-ellipsis/></p>
	<div v-if="!initializing && posts.length > 0">
		<template each={ posts }>
			<mk-user-overview-posts-post-card post={ this }/>
		</template>
	</div>
	<p class="empty" v-if="!initializing && posts.length == 0">%i18n:mobile.tags.mk-user-overview-posts.no-posts%</p>
	<style lang="stylus" scoped>
		:scope
			display block

			> div
				overflow-x scroll
				-webkit-overflow-scrolling touch
				white-space nowrap
				padding 8px

				> *
					vertical-align top

					&:not(:last-child)
						margin-right 8px

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
			this.$root.$data.os.api('users/posts', {
				user_id: this.user.id
			}).then(posts => {
				this.update({
					posts: posts,
					initializing: false
				});
			});
		});
	</script>
</mk-user-overview-posts>

<mk-user-overview-posts-post-card>
	<a href={ '/' + post.user.username + '/' + post.id }>
		<header>
			<img src={ post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/><h3>{ post.user.name }</h3>
		</header>
		<div>
			{ text }
		</div>
		<mk-time time={ post.created_at }/>
	</a>
	<style lang="stylus" scoped>
		:scope
			display inline-block
			width 150px
			//height 120px
			font-size 12px
			background #fff
			border-radius 4px

			> a
				display block
				color #2c3940

				&:hover
					text-decoration none

				> header
					> img
						position absolute
						top 8px
						left 8px
						width 28px
						height 28px
						border-radius 6px

					> h3
						display inline-block
						overflow hidden
						width calc(100% - 45px)
						margin 8px 0 0 42px
						line-height 28px
						white-space nowrap
						text-overflow ellipsis
						font-size 12px

				> div
					padding 2px 8px 8px 8px
					height 60px
					overflow hidden
					white-space normal

					&:after
						content ""
						display block
						position absolute
						top 40px
						left 0
						width 100%
						height 20px
						background linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #fff 100%)

				> mk-time
					display inline-block
					padding 8px
					color #aaa

	</style>
	<script lang="typescript">
		import summary from '../../../../common/get-post-summary.ts';

		this.post = this.opts.post;
		this.text = summary(this.post);
	</script>
</mk-user-overview-posts-post-card>

<mk-user-overview-photos>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:mobile.tags.mk-user-overview-photos.loading%<mk-ellipsis/></p>
	<div class="stream" v-if="!initializing && images.length > 0">
		<template each={ image in images }>
			<a class="img" style={ 'background-image: url(' + image.media.url + '?thumbnail&size=256)' } href={ '/' + image.post.user.username + '/' + image.post.id }></a>
		</template>
	</div>
	<p class="empty" v-if="!initializing && images.length == 0">%i18n:mobile.tags.mk-user-overview-photos.no-photos%</p>
	<style lang="stylus" scoped>
		:scope
			display block

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
					border-radius 4px

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

		this.images = [];
		this.initializing = true;
		this.user = this.opts.user;

		this.on('mount', () => {
			this.$root.$data.os.api('users/posts', {
				user_id: this.user.id,
				with_media: true,
				limit: 6
			}).then(posts => {
				this.initializing = false;
				posts.forEach(post => {
					post.media.forEach(media => {
						if (this.images.length < 9) this.images.push({
							post,
							media
						});
					});
				});
				this.update();
			});
		});
	</script>
</mk-user-overview-photos>

<mk-user-overview-activity-chart>
	<svg v-if="data" ref="canvas" viewBox="0 0 30 1" preserveAspectRatio="none">
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
	<style lang="stylus" scoped>
		:scope
			display block
			max-width 600px
			margin 0 auto

			> svg
				display block
				width 100%
				height 80px

				> rect
					transform-origin center

	</style>
	<script lang="typescript">
		this.mixin('api');

		this.user = this.opts.user;

		this.on('mount', () => {
			this.$root.$data.os.api('aggregation/users/activity', {
				user_id: this.user.id,
				limit: 30
			}).then(data => {
				data.forEach(d => d.total = d.posts + d.replies + d.reposts);
				this.peak = Math.max.apply(null, data.map(d => d.total));
				data.forEach(d => {
					d.postsH = d.posts / this.peak;
					d.repliesH = d.replies / this.peak;
					d.repostsH = d.reposts / this.peak;
				});
				this.update({ data });
			});
		});
	</script>
</mk-user-overview-activity-chart>

<mk-user-overview-keywords>
	<div v-if="user.keywords != null && user.keywords.length > 1">
		<template each={ keyword in user.keywords }>
			<a>{ keyword }</a>
		</template>
	</div>
	<p class="empty" v-if="user.keywords == null || user.keywords.length == 0">%i18n:mobile.tags.mk-user-overview-keywords.no-keywords%</p>
	<style lang="stylus" scoped>
		:scope
			display block

			> div
				padding 4px

				> a
					display inline-block
					margin 4px
					color #555

			> .empty
				margin 0
				padding 16px
				text-align center
				color #aaa

				> i
					margin-right 4px

	</style>
	<script lang="typescript">
		this.user = this.opts.user;
	</script>
</mk-user-overview-keywords>

<mk-user-overview-domains>
	<div v-if="user.domains != null && user.domains.length > 1">
		<template each={ domain in user.domains }>
			<a style="opacity: { 0.5 + (domain.weight / 2) }">{ domain.domain }</a>
		</template>
	</div>
	<p class="empty" v-if="user.domains == null || user.domains.length == 0">%i18n:mobile.tags.mk-user-overview-domains.no-domains%</p>
	<style lang="stylus" scoped>
		:scope
			display block

			> div
				padding 4px

				> a
					display inline-block
					margin 4px
					color #555

			> .empty
				margin 0
				padding 16px
				text-align center
				color #aaa

				> i
					margin-right 4px

	</style>
	<script lang="typescript">
		this.user = this.opts.user;
	</script>
</mk-user-overview-domains>

<mk-user-overview-frequently-replied-users>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:mobile.tags.mk-user-overview-frequently-replied-users.loading%<mk-ellipsis/></p>
	<div v-if="!initializing && users.length > 0">
		<template each={ users }>
			<mk-user-card user={ this.user }/>
		</template>
	</div>
	<p class="empty" v-if="!initializing && users.length == 0">%i18n:mobile.tags.mk-user-overview-frequently-replied-users.no-users%</p>
	<style lang="stylus" scoped>
		:scope
			display block

			> div
				overflow-x scroll
				-webkit-overflow-scrolling touch
				white-space nowrap
				padding 8px

				> mk-user-card
					&:not(:last-child)
						margin-right 8px

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
			this.$root.$data.os.api('users/get_frequently_replied_users', {
				user_id: this.user.id
			}).then(x => {
				this.update({
					users: x,
					initializing: false
				});
			});
		});
	</script>
</mk-user-overview-frequently-replied-users>

<mk-user-overview-followers-you-know>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:mobile.tags.mk-user-overview-followers-you-know.loading%<mk-ellipsis/></p>
	<div v-if="!initializing && users.length > 0">
		<template each={ user in users }>
			<a href={ '/' + user.username }><img src={ user.avatar_url + '?thumbnail&size=64' } alt={ user.name }/></a>
		</template>
	</div>
	<p class="empty" v-if="!initializing && users.length == 0">%i18n:mobile.tags.mk-user-overview-followers-you-know.no-users%</p>
	<style lang="stylus" scoped>
		:scope
			display block

			> div
				padding 4px

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
			this.$root.$data.os.api('users/followers', {
				user_id: this.user.id,
				iknow: true,
				limit: 30
			}).then(x => {
				this.update({
					users: x.users,
					initializing: false
				});
			});
		});
	</script>
</mk-user-overview-followers-you-know>

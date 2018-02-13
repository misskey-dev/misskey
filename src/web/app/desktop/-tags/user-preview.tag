<mk-user-preview>
	<template v-if="user != null">
		<div class="banner" style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=512)' : '' }></div><a class="avatar" href={ '/' + user.username } target="_blank"><img src={ user.avatar_url + '?thumbnail&size=64' } alt="avatar"/></a>
		<div class="title">
			<p class="name">{ user.name }</p>
			<p class="username">@{ user.username }</p>
		</div>
		<div class="description">{ user.description }</div>
		<div class="status">
			<div>
				<p>投稿</p><a>{ user.posts_count }</a>
			</div>
			<div>
				<p>フォロー</p><a>{ user.following_count }</a>
			</div>
			<div>
				<p>フォロワー</p><a>{ user.followers_count }</a>
			</div>
		</div>
		<mk-follow-button v-if="SIGNIN && user.id != I.id" user={ userPromise }/>
	</template>
	<style lang="stylus" scoped>
		:scope
			display block
			position absolute
			z-index 2048
			margin-top -8px
			width 250px
			background #fff
			background-clip content-box
			border solid 1px rgba(0, 0, 0, 0.1)
			border-radius 4px
			overflow hidden
			opacity 0

			> .banner
				height 84px
				background-color #f5f5f5
				background-size cover
				background-position center

			> .avatar
				display block
				position absolute
				top 62px
				left 13px

				> img
					display block
					width 58px
					height 58px
					margin 0
					border solid 3px #fff
					border-radius 8px

			> .title
				display block
				padding 8px 0 8px 82px

				> .name
					display block
					margin 0
					font-weight bold
					line-height 16px
					color #656565

				> .username
					display block
					margin 0
					line-height 16px
					font-size 0.8em
					color #999

			> .description
				padding 0 16px
				font-size 0.7em
				color #555

			> .status
				padding 8px 16px

				> div
					display inline-block
					width 33%

					> p
						margin 0
						font-size 0.7em
						color #aaa

					> a
						font-size 1em
						color $theme-color

			> mk-follow-button
				position absolute
				top 92px
				right 8px

	</style>
	<script lang="typescript">
		import * as anime from 'animejs';

		this.mixin('i');
		this.mixin('api');

		this.u = this.opts.user;
		this.user = null;
		this.userPromise =
			typeof this.u == 'string' ?
				new Promise((resolve, reject) => {
					this.api('users/show', {
						user_id: this.u[0] == '@' ? undefined : this.u,
						username: this.u[0] == '@' ? this.u.substr(1) : undefined
					}).then(resolve);
				})
			: Promise.resolve(this.u);

		this.on('mount', () => {
			this.userPromise.then(user => {
				this.update({
					user: user
				});
				this.open();
			});
		});

		this.open = () => {
			anime({
				targets: this.root,
				opacity: 1,
				'margin-top': 0,
				duration: 200,
				easing: 'easeOutQuad'
			});
		};

		this.close = () => {
			anime({
				targets: this.root,
				opacity: 0,
				'margin-top': '-8px',
				duration: 200,
				easing: 'easeOutQuad',
				complete: () => this.$destroy()
			});
		};
	</script>
</mk-user-preview>

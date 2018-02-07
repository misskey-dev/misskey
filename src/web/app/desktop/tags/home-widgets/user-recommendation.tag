<mk-user-recommendation-home-widget>
	<virtual if={ !data.compact }>
		<p class="title">%fa:users%%i18n:desktop.tags.mk-user-recommendation-home-widget.title%</p>
		<button @click="refresh" title="%i18n:desktop.tags.mk-user-recommendation-home-widget.refresh%">%fa:sync%</button>
	</virtual>
	<div class="user" if={ !loading && users.length != 0 } each={ _user in users }>
		<a class="avatar-anchor" href={ '/' + _user.username }>
			<img class="avatar" src={ _user.avatar_url + '?thumbnail&size=42' } alt="" data-user-preview={ _user.id }/>
		</a>
		<div class="body">
			<a class="name" href={ '/' + _user.username } data-user-preview={ _user.id }>{ _user.name }</a>
			<p class="username">@{ _user.username }</p>
		</div>
		<mk-follow-button user={ _user }/>
	</div>
	<p class="empty" if={ !loading && users.length == 0 }>%i18n:desktop.tags.mk-user-recommendation-home-widget.no-one%</p>
	<p class="loading" if={ loading }>%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<style>
		:scope
			display block
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> .title
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				border-bottom solid 1px #eee

				> [data-fa]
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

				> [data-fa]
					margin-right 4px

	</style>
	<script>
		this.data = {
			compact: false
		};

		this.mixin('widget');
		this.mixin('user-preview');

		this.users = null;
		this.loading = true;

		this.limit = 3;
		this.page = 0;

		this.on('mount', () => {
			this.fetch();
		});

		this.fetch = () => {
			this.update({
				loading: true,
				users: null
			});
			this.api('users/recommendation', {
				limit: this.limit,
				offset: this.limit * this.page
			}).then(users => {
				this.update({
					loading: false,
					users: users
				});
			});
		};

		this.refresh = () => {
			if (this.users.length < this.limit) {
				this.page = 0;
			} else {
				this.page++;
			}
			this.fetch();
		};

		this.func = () => {
			this.data.compact = !this.data.compact;
			this.save();
		};
	</script>
</mk-user-recommendation-home-widget>

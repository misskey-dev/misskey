<mk-ui-nav>
	<div class="backdrop" onclick={ parent.toggleDrawer }></div>
	<div class="body">
		<a class="me" if={ SIGNIN } href={ '/' + I.username }>
			<img class="avatar" src={ I.avatar_url + '?thumbnail&size=128' } alt="avatar"/>
			<p class="name">{ I.name }</p>
		</a>
		<div class="links">
			<ul>
				<li><a href="/"><i class="fa fa-home"></i>%i18n:mobile.tags.mk-ui-nav.home%<i class="fa fa-angle-right"></i></a></li>
				<li><a href="/i/notifications"><i class="fa fa-bell-o"></i>%i18n:mobile.tags.mk-ui-nav.notifications%<i class="fa fa-angle-right"></i></a></li>
				<li><a href="/i/messaging"><i class="fa fa-comments-o"></i>%i18n:mobile.tags.mk-ui-nav.messaging%<i class="i fa fa-circle" if={ hasUnreadMessagingMessages }></i><i class="fa fa-angle-right"></i></a></li>
			</ul>
			<ul>
				<li><a onclick={ search }><i class="fa fa-search"></i>%i18n:mobile.tags.mk-ui-nav.search%<i class="fa fa-angle-right"></i></a></li>
			</ul>
			<ul>
				<li><a href="/i/drive"><i class="fa fa-cloud"></i>%i18n:mobile.tags.mk-ui-nav.drive%<i class="fa fa-angle-right"></i></a></li>
			</ul>
			<ul>
				<li><a href="/i/settings"><i class="fa fa-cog"></i>%i18n:mobile.tags.mk-ui-nav.settings%<i class="fa fa-angle-right"></i></a></li>
			</ul>
		</div>
		<a href={ CONFIG.aboutUrl }><p class="about">%i18n:mobile.tags.mk-ui-nav.about%</p></a>
	</div>
	<style>
		:scope
			display none

			.backdrop
				position fixed
				top 0
				left 0
				z-index 1025
				width 100%
				height 100%
				background rgba(0, 0, 0, 0.2)

			.body
				position fixed
				top 0
				left 0
				z-index 1026
				width 240px
				height 100%
				overflow auto
				-webkit-overflow-scrolling touch
				color #777
				background #fff

			.me
				display block
				margin 0
				padding 16px

				.avatar
					display inline
					max-width 64px
					border-radius 32px
					vertical-align middle

				.name
					display block
					margin 0 16px
					position absolute
					top 0
					left 80px
					padding 0
					width calc(100% - 112px)
					color #777
					line-height 96px
					overflow hidden
					text-overflow ellipsis
					white-space nowrap

			ul
				display block
				margin 16px 0
				padding 0
				list-style none

				&:first-child
					margin-top 0

				li
					display block
					font-size 1em
					line-height 1em

					a
						display block
						padding 0 20px
						line-height 3rem
						line-height calc(1rem + 30px)
						color #777
						text-decoration none

						> i:first-child
							margin-right 0.5em

						> .i
							margin-left 6px
							vertical-align super
							font-size 10px
							color $theme-color

						> i:last-child
							position absolute
							top 0
							right 0
							padding 0 20px
							font-size 1.2em
							line-height calc(1rem + 30px)
							color #ccc

			.about
				margin 0
				padding 1em 0
				text-align center
				font-size 0.8em
				opacity 0.5

				a
					color #777

	</style>
	<script>
		this.mixin('i');
		this.mixin('page');
		this.mixin('api');
		this.mixin('stream');

		this.on('mount', () => {
			this.stream.on('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.stream.on('unread_messaging_message', this.onUnreadMessagingMessage);

			// Fetch count of unread messaging messages
			this.api('messaging/unread').then(res => {
				if (res.count > 0) {
					this.update({
						hasUnreadMessagingMessages: true
					});
				}
			});
		});

		this.on('unmount', () => {
			this.stream.off('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.stream.off('unread_messaging_message', this.onUnreadMessagingMessage);
		});

		this.onReadAllMessagingMessages = () => {
			this.update({
				hasUnreadMessagingMessages: false
			});
		};

		this.onUnreadMessagingMessage = () => {
			this.update({
				hasUnreadMessagingMessages: true
			});
		};

		this.search = () => {
			const query = window.prompt('%i18n:mobile.tags.mk-ui-nav.search%');
			if (query == null || query == '') return;
			this.page('/search:' + query);
		};
	</script>
</mk-ui-nav>

<mk-ui>
	<mk-ui-header/>
	<mk-ui-nav ref="nav"/>
	<div class="content">
		<yield />
	</div>
	<mk-stream-indicator v-if="SIGNIN"/>
	<style lang="stylus" scoped>
		:scope
			display block
			padding-top 48px
	</style>
	<script lang="typescript">
		this.mixin('i');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.isDrawerOpening = false;

		this.on('mount', () => {
			this.connection.on('notification', this.onStreamNotification);
		});

		this.on('unmount', () => {
			this.connection.off('notification', this.onStreamNotification);
			this.stream.dispose(this.connectionId);
		});

		this.toggleDrawer = () => {
			this.isDrawerOpening = !this.isDrawerOpening;
			this.$refs.nav.root.style.display = this.isDrawerOpening ? 'block' : 'none';
		};

		this.onStreamNotification = notification => {
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			this.connection.send({
				type: 'read_notification',
				id: notification.id
			});

			riot.mount(document.body.appendChild(document.createElement('mk-notify')), {
				notification: notification
			});
		};
	</script>
</mk-ui>

<mk-ui-header>
	<mk-special-message/>
	<div class="main">
		<div class="backdrop"></div>
		<div class="content">
			<button class="nav" @click="parent.toggleDrawer">%fa:bars%</button>
			<template v-if="hasUnreadNotifications || hasUnreadMessagingMessages">%fa:circle%</template>
			<h1 ref="title">Misskey</h1>
			<button v-if="func" @click="func"><mk-raw content={ funcIcon }/></button>
		</div>
	</div>
	<style lang="stylus" scoped>
		:scope
			$height = 48px

			display block
			position fixed
			top 0
			z-index 1024
			width 100%
			box-shadow 0 1px 0 rgba(#000, 0.075)

			> .main
				color rgba(#fff, 0.9)

				> .backdrop
					position absolute
					top 0
					z-index 1023
					width 100%
					height $height
					-webkit-backdrop-filter blur(12px)
					backdrop-filter blur(12px)
					background-color rgba(#1b2023, 0.75)

				> .content
					z-index 1024

					> h1
						display block
						margin 0 auto
						padding 0
						width 100%
						max-width calc(100% - 112px)
						text-align center
						font-size 1.1em
						font-weight normal
						line-height $height
						white-space nowrap
						overflow hidden
						text-overflow ellipsis

						[data-fa]
							margin-right 8px

						> img
							display inline-block
							vertical-align bottom
							width ($height - 16px)
							height ($height - 16px)
							margin 8px
							border-radius 6px

					> .nav
						display block
						position absolute
						top 0
						left 0
						width $height
						font-size 1.4em
						line-height $height
						border-right solid 1px rgba(#000, 0.1)

						> [data-fa]
							transition all 0.2s ease

					> [data-fa].circle
						position absolute
						top 8px
						left 8px
						pointer-events none
						font-size 10px
						color $theme-color

					> button:last-child
						display block
						position absolute
						top 0
						right 0
						width $height
						text-align center
						font-size 1.4em
						color inherit
						line-height $height
						border-left solid 1px rgba(#000, 0.1)

	</style>
	<script lang="typescript">
		import ui from '../scripts/ui-event';

		this.mixin('api');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.func = null;
		this.funcIcon = null;

		this.on('mount', () => {
			this.connection.on('read_all_notifications', this.onReadAllNotifications);
			this.connection.on('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.on('unread_messaging_message', this.onUnreadMessagingMessage);

			// Fetch count of unread notifications
			this.api('notifications/get_unread_count').then(res => {
				if (res.count > 0) {
					this.update({
						hasUnreadNotifications: true
					});
				}
			});

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
			this.connection.off('read_all_notifications', this.onReadAllNotifications);
			this.connection.off('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.off('unread_messaging_message', this.onUnreadMessagingMessage);
			this.stream.dispose(this.connectionId);

			ui.off('title', this.setTitle);
			ui.off('func', this.setFunc);
		});

		this.onReadAllNotifications = () => {
			this.update({
				hasUnreadNotifications: false
			});
		};

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

		this.setTitle = title => {
			this.$refs.title.innerHTML = title;
		};

		this.setFunc = (fn, icon) => {
			this.update({
				func: fn,
				funcIcon: icon
			});
		};

		ui.on('title', this.setTitle);
		ui.on('func', this.setFunc);
	</script>
</mk-ui-header>

<mk-ui-nav>
	<div class="backdrop" @click="parent.toggleDrawer"></div>
	<div class="body">
		<a class="me" v-if="SIGNIN" href={ '/' + I.username }>
			<img class="avatar" src={ I.avatar_url + '?thumbnail&size=128' } alt="avatar"/>
			<p class="name">{ I.name }</p>
		</a>
		<div class="links">
			<ul>
				<li><a href="/">%fa:home%%i18n:mobile.tags.mk-ui-nav.home%%fa:angle-right%</a></li>
				<li><a href="/i/notifications">%fa:R bell%%i18n:mobile.tags.mk-ui-nav.notifications%<template v-if="hasUnreadNotifications">%fa:circle%</template>%fa:angle-right%</a></li>
				<li><a href="/i/messaging">%fa:R comments%%i18n:mobile.tags.mk-ui-nav.messaging%<template v-if="hasUnreadMessagingMessages">%fa:circle%</template>%fa:angle-right%</a></li>
			</ul>
			<ul>
				<li><a href={ _CH_URL_ } target="_blank">%fa:tv%%i18n:mobile.tags.mk-ui-nav.ch%%fa:angle-right%</a></li>
				<li><a href="/i/drive">%fa:cloud%%i18n:mobile.tags.mk-ui-nav.drive%%fa:angle-right%</a></li>
			</ul>
			<ul>
				<li><a @click="search">%fa:search%%i18n:mobile.tags.mk-ui-nav.search%%fa:angle-right%</a></li>
			</ul>
			<ul>
				<li><a href="/i/settings">%fa:cog%%i18n:mobile.tags.mk-ui-nav.settings%%fa:angle-right%</a></li>
			</ul>
		</div>
		<a href={ aboutUrl }><p class="about">%i18n:mobile.tags.mk-ui-nav.about%</p></a>
	</div>
	<style lang="stylus" scoped>
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

						> [data-fa]:first-child
							margin-right 0.5em

						> [data-fa].circle
							margin-left 6px
							font-size 10px
							color $theme-color

						> [data-fa]:last-child
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
	<script lang="typescript">
		this.mixin('i');
		this.mixin('page');
		this.mixin('api');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.aboutUrl = `${_DOCS_URL_}/${_LANG_}/about`;

		this.on('mount', () => {
			this.connection.on('read_all_notifications', this.onReadAllNotifications);
			this.connection.on('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.on('unread_messaging_message', this.onUnreadMessagingMessage);

			// Fetch count of unread notifications
			this.api('notifications/get_unread_count').then(res => {
				if (res.count > 0) {
					this.update({
						hasUnreadNotifications: true
					});
				}
			});

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
			this.connection.off('read_all_notifications', this.onReadAllNotifications);
			this.connection.off('read_all_messaging_messages', this.onReadAllMessagingMessages);
			this.connection.off('unread_messaging_message', this.onUnreadMessagingMessage);
			this.stream.dispose(this.connectionId);
		});

		this.onReadAllNotifications = () => {
			this.update({
				hasUnreadNotifications: false
			});
		};

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
			this.page('/search?q=' + encodeURIComponent(query));
		};
	</script>
</mk-ui-nav>

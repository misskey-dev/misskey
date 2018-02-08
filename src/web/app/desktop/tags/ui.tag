<mk-ui>
	<mk-ui-header page={ opts.page }/>
	<mk-set-avatar-suggestion v-if="SIGNIN && I.avatar_id == null"/>
	<mk-set-banner-suggestion v-if="SIGNIN && I.banner_id == null"/>
	<div class="content">
		<yield />
	</div>
	<mk-stream-indicator v-if="SIGNIN"/>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script lang="typescript">
		this.mixin('i');

		this.openPostForm = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-post-form-window')));
		};

		this.on('mount', () => {
			document.addEventListener('keydown', this.onkeydown);
		});

		this.on('unmount', () => {
			document.removeEventListener('keydown', this.onkeydown);
		});

		this.onkeydown = e => {
			if (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') return;

			if (e.which == 80 || e.which == 78) { // p or n
				e.preventDefault();
				this.openPostForm();
			}
		};
	</script>
</mk-ui>

<mk-ui-header>
	<mk-donation v-if="SIGNIN && I.client_settings.show_donation"/>
	<mk-special-message/>
	<div class="main">
		<div class="backdrop"></div>
		<div class="main">
			<div class="container">
				<div class="left">
					<mk-ui-header-nav page={ opts.page }/>
				</div>
				<div class="right">
					<mk-ui-header-search/>
					<mk-ui-header-account v-if="SIGNIN"/>
					<mk-ui-header-notifications v-if="SIGNIN"/>
					<mk-ui-header-post-button v-if="SIGNIN"/>
					<mk-ui-header-clock/>
				</div>
			</div>
		</div>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
			position -webkit-sticky
			position sticky
			top 0
			z-index 1024
			width 100%
			box-shadow 0 1px 1px rgba(0, 0, 0, 0.075)

			> .main

				> .backdrop
					position absolute
					top 0
					z-index 1023
					width 100%
					height 48px
					backdrop-filter blur(12px)
					background #f7f7f7

					&:after
						content ""
						display block
						width 100%
						height 48px
						background-image url(/assets/desktop/header-logo.svg)
						background-size 46px
						background-position center
						background-repeat no-repeat
						opacity 0.3

				> .main
					z-index 1024
					margin 0
					padding 0
					background-clip content-box
					font-size 0.9rem
					user-select none

					> .container
						width 100%
						max-width 1300px
						margin 0 auto

						&:after
							content ""
							display block
							clear both

						> .left
							float left
							height 3rem

						> .right
							float right
							height 48px

							@media (max-width 1100px)
								> mk-ui-header-search
									display none

	</style>
	<script lang="typescript">this.mixin('i');</script>
</mk-ui-header>

<mk-ui-header-search>
	<form class="search" onsubmit={ onsubmit }>
		%fa:search%
		<input ref="q" type="search" placeholder="%i18n:desktop.tags.mk-ui-header-search.placeholder%"/>
		<div class="result"></div>
	</form>
	<style lang="stylus" scoped>
		:scope

			> form
				display block
				float left

				> [data-fa]
					display block
					position absolute
					top 0
					left 0
					width 48px
					text-align center
					line-height 48px
					color #9eaba8
					pointer-events none

					> *
						vertical-align middle

				> input
					user-select text
					cursor auto
					margin 8px 0 0 0
					padding 6px 18px 6px 36px
					width 14em
					height 32px
					font-size 1em
					background rgba(0, 0, 0, 0.05)
					outline none
					//border solid 1px #ddd
					border none
					border-radius 16px
					transition color 0.5s ease, border 0.5s ease
					font-family FontAwesome, sans-serif

					&::placeholder
						color #9eaba8

					&:hover
						background rgba(0, 0, 0, 0.08)

					&:focus
						box-shadow 0 0 0 2px rgba($theme-color, 0.5) !important

	</style>
	<script lang="typescript">
		this.mixin('page');

		this.onsubmit = e => {
			e.preventDefault();
			this.page('/search?q=' + encodeURIComponent(this.$refs.q.value));
		};
	</script>
</mk-ui-header-search>

<mk-ui-header-post-button>
	<button @click="post" title="%i18n:desktop.tags.mk-ui-header-post-button.post%">%fa:pencil-alt%</button>
	<style lang="stylus" scoped>
		:scope
			display inline-block
			padding 8px
			height 100%
			vertical-align top

			> button
				display inline-block
				margin 0
				padding 0 10px
				height 100%
				font-size 1.2em
				font-weight normal
				text-decoration none
				color $theme-color-foreground
				background $theme-color !important
				outline none
				border none
				border-radius 4px
				transition background 0.1s ease
				cursor pointer

				*
					pointer-events none

				&:hover
					background lighten($theme-color, 10%) !important

				&:active
					background darken($theme-color, 10%) !important
					transition background 0s ease

	</style>
	<script lang="typescript">
		this.post = e => {
			this.parent.parent.openPostForm();
		};
	</script>
</mk-ui-header-post-button>

<mk-ui-header-notifications>
	<button data-active={ isOpen } @click="toggle" title="%i18n:desktop.tags.mk-ui-header-notifications.title%">
		%fa:R bell%<template v-if="hasUnreadNotifications">%fa:circle%</template>
	</button>
	<div class="notifications" v-if="isOpen">
		<mk-notifications/>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
			float left

			> button
				display block
				margin 0
				padding 0
				width 32px
				color #9eaba8
				border none
				background transparent
				cursor pointer

				*
					pointer-events none

				&:hover
				&[data-active='true']
					color darken(#9eaba8, 20%)

				&:active
					color darken(#9eaba8, 30%)

				> [data-fa].bell
					font-size 1.2em
					line-height 48px

				> [data-fa].circle
					margin-left -5px
					vertical-align super
					font-size 10px
					color $theme-color

			> .notifications
				display block
				position absolute
				top 56px
				right -72px
				width 300px
				background #fff
				border-radius 4px
				box-shadow 0 1px 4px rgba(0, 0, 0, 0.25)

				&:before
					content ""
					pointer-events none
					display block
					position absolute
					top -28px
					right 74px
					border-top solid 14px transparent
					border-right solid 14px transparent
					border-bottom solid 14px rgba(0, 0, 0, 0.1)
					border-left solid 14px transparent

				&:after
					content ""
					pointer-events none
					display block
					position absolute
					top -27px
					right 74px
					border-top solid 14px transparent
					border-right solid 14px transparent
					border-bottom solid 14px #fff
					border-left solid 14px transparent

				> mk-notifications
					max-height 350px
					font-size 1rem
					overflow auto

	</style>
	<script lang="typescript">
		import contains from '../../common/scripts/contains';

		this.mixin('i');
		this.mixin('api');

		if (this.SIGNIN) {
			this.mixin('stream');
			this.connection = this.stream.getConnection();
			this.connectionId = this.stream.use();
		}

		this.isOpen = false;

		this.on('mount', () => {
			if (this.SIGNIN) {
				this.connection.on('read_all_notifications', this.onReadAllNotifications);
				this.connection.on('unread_notification', this.onUnreadNotification);

				// Fetch count of unread notifications
				this.api('notifications/get_unread_count').then(res => {
					if (res.count > 0) {
						this.update({
							hasUnreadNotifications: true
						});
					}
				});
			}
		});

		this.on('unmount', () => {
			if (this.SIGNIN) {
				this.connection.off('read_all_notifications', this.onReadAllNotifications);
				this.connection.off('unread_notification', this.onUnreadNotification);
				this.stream.dispose(this.connectionId);
			}
		});

		this.onReadAllNotifications = () => {
			this.update({
				hasUnreadNotifications: false
			});
		};

		this.onUnreadNotification = () => {
			this.update({
				hasUnreadNotifications: true
			});
		};

		this.toggle = () => {
			this.isOpen ? this.close() : this.open();
		};

		this.open = () => {
			this.update({
				isOpen: true
			});
			document.querySelectorAll('body *').forEach(el => {
				el.addEventListener('mousedown', this.mousedown);
			});
		};

		this.close = () => {
			this.update({
				isOpen: false
			});
			document.querySelectorAll('body *').forEach(el => {
				el.removeEventListener('mousedown', this.mousedown);
			});
		};

		this.mousedown = e => {
			e.preventDefault();
			if (!contains(this.root, e.target) && this.root != e.target) this.close();
			return false;
		};
	</script>
</mk-ui-header-notifications>

<mk-ui-header-nav>
	<ul>
		<template v-if="SIGNIN">
			<li class="home { active: page == 'home' }">
				<a href={ _URL_ }>
					%fa:home%
					<p>%i18n:desktop.tags.mk-ui-header-nav.home%</p>
				</a>
			</li>
			<li class="messaging">
				<a @click="messaging">
					%fa:comments%
					<p>%i18n:desktop.tags.mk-ui-header-nav.messaging%</p>
					<template v-if="hasUnreadMessagingMessages">%fa:circle%</template>
				</a>
			</li>
		</template>
		<li class="ch">
			<a href={ _CH_URL_ } target="_blank">
				%fa:tv%
				<p>%i18n:desktop.tags.mk-ui-header-nav.ch%</p>
			</a>
		</li>
		<li class="info">
			<a href="https://twitter.com/misskey_xyz" target="_blank">
				%fa:info%
				<p>%i18n:desktop.tags.mk-ui-header-nav.info%</p>
			</a>
		</li>
	</ul>
	<style lang="stylus" scoped>
		:scope
			display inline-block
			margin 0
			padding 0
			line-height 3rem
			vertical-align top

			> ul
				display inline-block
				margin 0
				padding 0
				vertical-align top
				line-height 3rem
				list-style none

				> li
					display inline-block
					vertical-align top
					height 48px
					line-height 48px

					&.active
						> a
							border-bottom solid 3px $theme-color

					> a
						display inline-block
						z-index 1
						height 100%
						padding 0 24px
						font-size 13px
						font-variant small-caps
						color #9eaba8
						text-decoration none
						transition none
						cursor pointer

						*
							pointer-events none

						&:hover
							color darken(#9eaba8, 20%)
							text-decoration none

						> [data-fa]:first-child
							margin-right 8px

						> [data-fa]:last-child
							margin-left 5px
							font-size 10px
							color $theme-color

							@media (max-width 1100px)
								margin-left -5px

						> p
							display inline
							margin 0

							@media (max-width 1100px)
								display none

						@media (max-width 700px)
							padding 0 12px

	</style>
	<script lang="typescript">
		this.mixin('i');
		this.mixin('api');

		if (this.SIGNIN) {
			this.mixin('stream');
			this.connection = this.stream.getConnection();
			this.connectionId = this.stream.use();
		}

		this.page = this.opts.page;

		this.on('mount', () => {
			if (this.SIGNIN) {
				this.connection.on('read_all_messaging_messages', this.onReadAllMessagingMessages);
				this.connection.on('unread_messaging_message', this.onUnreadMessagingMessage);

				// Fetch count of unread messaging messages
				this.api('messaging/unread').then(res => {
					if (res.count > 0) {
						this.update({
							hasUnreadMessagingMessages: true
						});
					}
				});
			}
		});

		this.on('unmount', () => {
			if (this.SIGNIN) {
				this.connection.off('read_all_messaging_messages', this.onReadAllMessagingMessages);
				this.connection.off('unread_messaging_message', this.onUnreadMessagingMessage);
				this.stream.dispose(this.connectionId);
			}
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

		this.messaging = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-messaging-window')));
		};
	</script>
</mk-ui-header-nav>

<mk-ui-header-clock>
	<div class="header">
		<time ref="time">
			<span class="yyyymmdd">{ yyyy }/{ mm }/{ dd }</span>
			<br>
			<span class="hhnn">{ hh }<span style="visibility:{ now.getSeconds() % 2 == 0 ? 'visible' : 'hidden' }">:</span>{ nn }</span>
		</time>
	</div>
	<div class="content">
		<mk-analog-clock/>
	</div>
	<style lang="stylus" scoped>
		:scope
			display inline-block
			overflow visible

			> .header
				padding 0 12px
				text-align center
				font-size 10px

				&, *
					cursor: default

				&:hover
					background #899492

					& + .content
						visibility visible

					> time
						color #fff !important

						*
							color #fff !important

				&:after
					content ""
					display block
					clear both

				> time
					display table-cell
					vertical-align middle
					height 48px
					color #9eaba8

					> .yyyymmdd
						opacity 0.7

			> .content
				visibility hidden
				display block
				position absolute
				top auto
				right 0
				z-index 3
				margin 0
				padding 0
				width 256px
				background #899492

	</style>
	<script lang="typescript">
		this.now = new Date();

		this.draw = () => {
			const now = this.now = new Date();
			this.yyyy = now.getFullYear();
			this.mm = ('0' + (now.getMonth() + 1)).slice(-2);
			this.dd = ('0' + now.getDate()).slice(-2);
			this.hh = ('0' + now.getHours()).slice(-2);
			this.nn = ('0' + now.getMinutes()).slice(-2);
			this.update();
		};

		this.on('mount', () => {
			this.draw();
			this.clock = setInterval(this.draw, 1000);
		});

		this.on('unmount', () => {
			clearInterval(this.clock);
		});
	</script>
</mk-ui-header-clock>

<mk-ui-header-account>
	<button class="header" data-active={ isOpen.toString() } @click="toggle">
		<span class="username">{ I.username }<template v-if="!isOpen">%fa:angle-down%</template><template v-if="isOpen">%fa:angle-up%</template></span>
		<img class="avatar" src={ I.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
	</button>
	<div class="menu" v-if="isOpen">
		<ul>
			<li>
				<a href={ '/' + I.username }>%fa:user%%i18n:desktop.tags.mk-ui-header-account.profile%%fa:angle-right%</a>
			</li>
			<li @click="drive">
				<p>%fa:cloud%%i18n:desktop.tags.mk-ui-header-account.drive%%fa:angle-right%</p>
			</li>
			<li>
				<a href="/i/mentions">%fa:at%%i18n:desktop.tags.mk-ui-header-account.mentions%%fa:angle-right%</a>
			</li>
		</ul>
		<ul>
			<li @click="settings">
				<p>%fa:cog%%i18n:desktop.tags.mk-ui-header-account.settings%%fa:angle-right%</p>
			</li>
		</ul>
		<ul>
			<li @click="signout">
				<p>%fa:power-off%%i18n:desktop.tags.mk-ui-header-account.signout%%fa:angle-right%</p>
			</li>
		</ul>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
			float left

			> .header
				display block
				margin 0
				padding 0
				color #9eaba8
				border none
				background transparent
				cursor pointer

				*
					pointer-events none

				&:hover
				&[data-active='true']
					color darken(#9eaba8, 20%)

					> .avatar
						filter saturate(150%)

				&:active
					color darken(#9eaba8, 30%)

				> .username
					display block
					float left
					margin 0 12px 0 16px
					max-width 16em
					line-height 48px
					font-weight bold
					font-family Meiryo, sans-serif
					text-decoration none

					[data-fa]
						margin-left 8px

				> .avatar
					display block
					float left
					min-width 32px
					max-width 32px
					min-height 32px
					max-height 32px
					margin 8px 8px 8px 0
					border-radius 4px
					transition filter 100ms ease

			> .menu
				display block
				position absolute
				top 56px
				right -2px
				width 230px
				font-size 0.8em
				background #fff
				border-radius 4px
				box-shadow 0 1px 4px rgba(0, 0, 0, 0.25)

				&:before
					content ""
					pointer-events none
					display block
					position absolute
					top -28px
					right 12px
					border-top solid 14px transparent
					border-right solid 14px transparent
					border-bottom solid 14px rgba(0, 0, 0, 0.1)
					border-left solid 14px transparent

				&:after
					content ""
					pointer-events none
					display block
					position absolute
					top -27px
					right 12px
					border-top solid 14px transparent
					border-right solid 14px transparent
					border-bottom solid 14px #fff
					border-left solid 14px transparent

				ul
					display block
					margin 10px 0
					padding 0
					list-style none

					& + ul
						padding-top 10px
						border-top solid 1px #eee

					> li
						display block
						margin 0
						padding 0

						> a
						> p
							display block
							z-index 1
							padding 0 28px
							margin 0
							line-height 40px
							color #868C8C
							cursor pointer

							*
								pointer-events none

							> [data-fa]:first-of-type
								margin-right 6px

							> [data-fa]:last-of-type
								display block
								position absolute
								top 0
								right 8px
								z-index 1
								padding 0 20px
								font-size 1.2em
								line-height 40px

							&:hover, &:active
								text-decoration none
								background $theme-color
								color $theme-color-foreground

	</style>
	<script lang="typescript">
		import contains from '../../common/scripts/contains';
		import signout from '../../common/scripts/signout';
		this.signout = signout;

		this.mixin('i');

		this.isOpen = false;

		this.on('before-unmount', () => {
			this.close();
		});

		this.toggle = () => {
			this.isOpen ? this.close() : this.open();
		};

		this.open = () => {
			this.update({
				isOpen: true
			});
			document.querySelectorAll('body *').forEach(el => {
				el.addEventListener('mousedown', this.mousedown);
			});
		};

		this.close = () => {
			this.update({
				isOpen: false
			});
			document.querySelectorAll('body *').forEach(el => {
				el.removeEventListener('mousedown', this.mousedown);
			});
		};

		this.mousedown = e => {
			e.preventDefault();
			if (!contains(this.root, e.target) && this.root != e.target) this.close();
			return false;
		};

		this.drive = () => {
			this.close();
			riot.mount(document.body.appendChild(document.createElement('mk-drive-browser-window')));
		};

		this.settings = () => {
			this.close();
			riot.mount(document.body.appendChild(document.createElement('mk-settings-window')));
		};

	</script>
</mk-ui-header-account>

<mk-ui-notification>
	<p>{ opts.message }</p>
	<style lang="stylus" scoped>
		:scope
			display block
			position fixed
			z-index 10000
			top -128px
			left 0
			right 0
			margin 0 auto
			padding 128px 0 0 0
			width 500px
			color rgba(#000, 0.6)
			background rgba(#fff, 0.9)
			border-radius 0 0 8px 8px
			box-shadow 0 2px 4px rgba(#000, 0.2)
			transform translateY(-64px)
			opacity 0

			> p
				margin 0
				line-height 64px
				text-align center

	</style>
	<script lang="typescript">
		import anime from 'animejs';

		this.on('mount', () => {
			anime({
				targets: this.root,
				opacity: 1,
				translateY: [-64, 0],
				easing: 'easeOutElastic',
				duration: 500
			});

			setTimeout(() => {
				anime({
					targets: this.root,
					opacity: 0,
					translateY: -64,
					duration: 500,
					easing: 'easeInElastic',
					complete: () => this.$destroy()
				});
			}, 6000);
		});
	</script>
</mk-ui-notification>

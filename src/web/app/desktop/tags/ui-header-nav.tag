<mk-ui-header-nav>
	<ul if={ SIGNIN }>
		<li class="home { active: page == 'home' }"><a href={ CONFIG.url }><i class="fa fa-home"></i>
				<p>ホーム</p></a></li>
		<li class="messaging"><a onclick={ messaging }><i class="fa fa-comments"></i>
				<p>メッセージ</p><i class="fa fa-circle" if={ hasUnreadMessagingMessages }></i></a></li>
		<li class="info"><a href="https://twitter.com/misskey_xyz" target="_blank"><i class="fa fa-info"></i>
				<p>お知らせ</p></a></li>
		<li class="tv"><a href="https://misskey.tk" target="_blank"><i class="fa fa-television"></i>
				<p>MisskeyTV™</p></a></li>
		<style>
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
							font-size 1em
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

							> i:first-child
								margin-right 8px

							> i:last-child
								margin-left 5px
								vertical-align super
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
		<script>
			this.mixin('i');
			this.mixin('api');
			this.mixin('stream');

			this.page = this.opts.page

			this.on('mount', () => {
				@stream.on 'read_all_messaging_messages' this.on-read-all-messaging-messages
				@stream.on 'unread_messaging_message' this.on-unread-messaging-message

				// Fetch count of unread messaging messages
				this.api 'messaging/unread' 
				.then (count) =>
					if count.count > 0
						this.has-unread-messaging-messages = true
						this.update();

			this.on('unmount', () => {
				@stream.off 'read_all_messaging_messages' this.on-read-all-messaging-messages
				@stream.off 'unread_messaging_message' this.on-unread-messaging-message

			on-read-all-messaging-messages() {
				this.has-unread-messaging-messages = false
				this.update();

			on-unread-messaging-message() {
				this.has-unread-messaging-messages = true
				this.update();

			messaging() {
				riot.mount document.body.appendChild document.createElement 'mk-messaging-window' 
		</script>
	</ul>
</mk-ui-header-nav>

<mk-ui-header>
	<mk-special-message/>
	<div class="main">
		<div class="backdrop"></div>
		<div class="content">
			<button class="nav" onclick={ parent.toggleDrawer }><i class="fa fa-bars"></i></button>
			<i class="fa fa-circle" if={ hasUnreadMessagingMessages }></i>
			<h1 ref="title">Misskey</h1>
			<button if={ func } onclick={ func }><i class="fa fa-{ funcIcon }"></i></button>
		</div>
	</div>
	<style>
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

						> i
						> .icon
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

						> i
							transition all 0.2s ease

					> i
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
	<script>
		import ui from '../scripts/ui-event';

		this.mixin('api');
		this.mixin('stream');

		this.func = null;
		this.funcIcon = null;

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

			ui.off('title', this.setTitle);
			ui.off('func', this.setFunc);
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

		this.setTitle = title => {
			this.refs.title.innerHTML = title;
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

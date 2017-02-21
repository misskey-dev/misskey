<mk-ui>
	<div class="global" ref="global">
		<mk-ui-header ref="header"></mk-ui-header>
		<mk-ui-nav ref="nav"></mk-ui-nav>
		<div class="content" ref="main"><yield /></div>
	</div>
	<mk-stream-indicator></mk-stream-indicator>
	<style>
		:scope
			display block

			> .global
				> .content
					background #fff
	</style>
	<script>
		this.mixin('stream');

		this.isDrawerOpening = false;

		this.on('mount', () => {
			this.stream.on('notification', this.onStreamNotification);
		});

		this.on('unmount', () => {
			this.stream.off('notification', this.onStreamNotification);
		});

		this.toggleDrawer = () => {
			this.isDrawerOpening = !this.isDrawerOpening;
			this.refs.nav.root.style.display = this.isDrawerOpening ? 'block' : 'none';
		};

		this.onStreamNotification = notification => {
			riot.mount(document.body.appendChild(document.createElement('mk-notify')), {
				notification: notification
			});
		};
	</script>
</mk-ui>

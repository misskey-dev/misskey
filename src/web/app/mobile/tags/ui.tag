<mk-ui>
	<mk-ui-header></mk-ui-header>
	<mk-ui-nav ref="nav"></mk-ui-nav>
	<div class="content">
		<yield />
	</div>
	<mk-stream-indicator></mk-stream-indicator>
	<style>
		:scope
			display block
			padding-top 48px
	</style>
	<script>
		this.mixin('i');

		this.mixin('stream');

		const stream = this.stream.event;

		this.isDrawerOpening = false;

		this.on('mount', () => {
			stream.on('notification', this.onStreamNotification);
		});

		this.on('unmount', () => {
			stream.off('notification', this.onStreamNotification);
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

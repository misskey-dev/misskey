<mk-ui>
	<mk-ui-header/>
	<mk-ui-nav ref="nav"/>
	<div class="content">
		<yield />
	</div>
	<mk-stream-indicator if={ SIGNIN }/>
	<style>
		:scope
			display block
			padding-top 48px
	</style>
	<script>
		this.mixin('i');
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

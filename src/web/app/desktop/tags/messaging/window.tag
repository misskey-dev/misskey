<mk-messaging-window>
	<mk-window ref="window" is-modal={ false } width={ '500px' } height={ '560px' }>
		<yield to="header"><i class="fa fa-comments"></i>メッセージ</yield>
		<yield to="content">
			<mk-messaging ref="index"></mk-messaging>
		</yield>
	</mk-window>
	<style>
		:scope
			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

				[data-yield='content']
					> mk-messaging
						height 100%
						overflow auto

	</style>
	<script>
		this.on('mount', () => {
			this.refs.window.on('closed', () => {
				this.unmount();

			this.refs.window.refs.index.on('navigate-user', user => {
				w = document.body.appendChild(document.createElement('mk-messaging-room-window'));
 				riot.mount w, do
					user: user
	</script>
</mk-messaging-window>

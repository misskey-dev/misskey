<mk-messaging-room-window>
	<mk-window ref="window" is-modal={ false } width={ '500px' } height={ '560px' } popout={ popout }>
		<yield to="header"><i class="fa fa-comments"></i>メッセージ: { parent.user.name }</yield>
		<yield to="content">
			<mk-messaging-room user={ parent.user }/>
		</yield>
	</mk-window>
	<style>
		:scope
			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

				[data-yield='content']
					> mk-messaging-room
						height 100%
						overflow auto

	</style>
	<script>
		import CONFIG from '../../../common/scripts/config';

		this.user = this.opts.user;

		this.popout = `${CONFIG.url}/i/messaging/${this.user.username}`;

		this.on('mount', () => {
			this.refs.window.on('closed', () => {
				this.unmount();
			});
		});
	</script>
</mk-messaging-room-window>

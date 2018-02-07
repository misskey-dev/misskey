<mk-messaging-room-page>
	<mk-messaging-room v-if="user" user={ user } is-naked={ true }/>

	<style lang="stylus" scoped>
		:scope
			display block
			background #fff

	</style>
	<script>
		import Progress from '../../../common/scripts/loading';

		this.mixin('api');

		this.fetching = true;
		this.user = null;

		this.on('mount', () => {
			Progress.start();

			document.documentElement.style.background = '#fff';

			this.api('users/show', {
				username: this.opts.user
			}).then(user => {
				this.update({
					fetching: false,
					user: user
				});

				document.title = 'メッセージ: ' + this.user.name;

				Progress.done();
			});
		});
	</script>
</mk-messaging-room-page>

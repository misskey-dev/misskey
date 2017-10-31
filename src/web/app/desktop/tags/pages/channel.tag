<mk-channel-page>
	<mk-ui ref="ui">
		<main if={ !parent.fetching }>
			<h1>{ parent.channel.title }</h1>
		</main>
	</mk-ui>
	<style>
		:scope
			display block

			main
				> h1
					color #f00
	</style>
	<script>
		import Progress from '../../../common/scripts/loading';

		this.mixin('api');

		this.id = this.opts.id;
		this.fetching = true;
		this.channel = null;

		this.on('mount', () => {
			document.documentElement.style.background = '#efefef';

			Progress.start();

			this.api('channels/show', {
				channel_id: this.id
			}).then(channel => {
				Progress.done();

				this.update({
					fetching: false,
					channel: channel
				});

				document.title = channel.title + ' | Misskey'
			});
		});
	</script>
</mk-channel-page>

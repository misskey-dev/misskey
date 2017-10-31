<mk-index>
	<button onclick={ new }>%i18n:ch.tags.mk-index.new%</button>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('api');

		this.on('mount', () => {
		});

		this.new = () => {
			const title = window.prompt('%i18n:ch.tags.mk-index.channel-title%');

			this.api('channels/create', {
				title: title
			}).then(channel => {
				location.href = '/' + channel.id;
			});
		};
	</script>
</mk-index>

<mk-channels-page>
	<mk-ui ref="ui">
		<main>
			<button onclick={ parent.new }>%i18n:desktop.tags.mk-channels-page.new%</button>
		</main>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('api');

		this.on('mount', () => {
		});

		this.new = () => {
			const title = window.prompt('%i18n:desktop.tags.mk-channels-page.channel-title%');

			this.api('bbs/channels/create', {
				title: title
			}).then(channel => {
				location.href = '/channel/' + channel.id;
			});
		};
	</script>
</mk-channels-page>

<mk-bbs-page>
	<mk-ui ref="ui">
		<main>
			<h1>%i18n:desktop.tags.mk-bbs-page.title%</h1>
			<button onclick={ parent.new }>%i18n:desktop.tags.mk-bbs-page.new%</button>
		</main>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('api');

		this.on('mount', () => {
			document.title = '%i18n:desktop.tags.mk-bbs-page.title%';
		});

		this.new = () => {
			const title = window.prompt('%i18n:desktop.tags.mk-bbs-page.thread-title%');

			this.api('bbs/threads/create', {
				title: title
			}).then(thread => {
				location.href = '/bbs/' + thread.id;
			});
		};
	</script>
</mk-bbs-page>

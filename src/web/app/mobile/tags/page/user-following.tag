<mk-user-following-page>
	<mk-ui ref="ui">
		<mk-user-following ref="list" if={ !parent.fetching } user={ parent.user }></mk-user-following>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('ui');
		this.mixin('ui-progress');
		this.mixin('api');

		this.fetching = true
		this.user = null

		this.on('mount', () => {
			this.Progress.start();

			this.api 'users/show' do
				username: this.opts.user
			.then (user) =>
				this.user = user
				this.fetching = false

				document.title = user.name + 'のフォロー | Misskey'
				// TODO: ユーザー名をエスケープ
				this.ui.trigger('title', '<img src="'); + user.avatar_url + '?thumbnail&size=64">' + user.name + 'のフォロー'

				this.update();

				this.refs.ui.refs.list.on('loaded', () => {
					this.Progress.done();
	</script>
</mk-user-following-page>

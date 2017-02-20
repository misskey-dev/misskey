<mk-home-page>
	<mk-ui ref="ui">
		<mk-home ref="home"></mk-home>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('i');
		this.mixin('ui');
		this.mixin('ui-progress');
		this.mixin('stream');
		this.mixin('get-post-summary');

		this.unread-count = 0

		this.on('mount', () => {
			document.title = 'Misskey'
			this.ui.trigger('title', '<i class="fa fa-home"></i>ホーム');

			this.Progress.start();

			this.stream.on 'post' this.on-stream-post
			document.addEventListener 'visibilitychange' @window-on-visibilitychange, false

			this.refs.ui.refs.home.on('loaded', () => {
				this.Progress.done();

		this.on('unmount', () => {
			this.stream.off 'post' this.on-stream-post
			document.removeEventListener 'visibilitychange' @window-on-visibilitychange

		this.on-stream-post = (post) => {
			if document.hidden and post.user_id !== this.I.id
				@unread-count++
				document.title = '(' + @unread-count + ') ' + @get-post-summary post

		this.window-on-visibilitychange = () => {
			if !document.hidden
				this.unread-count = 0
				document.title = 'Misskey'
	</script>
</mk-home-page>

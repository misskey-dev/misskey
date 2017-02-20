<mk-home-page>
	<mk-ui ref="ui" page={ page }>
		<mk-home ref="home" mode={ parent.opts.mode }></mk-home>
	</mk-ui>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');
		this.mixin('ui-progress');
		this.mixin('stream');
		this.mixin('get-post-summary');

		this.unread-count = 0

		this.page = switch this.opts.mode
			| 'timelie' => 'home' 
			| 'mentions' => 'mentions' 
			| _ => 'home' 

		this.on('mount', () => {
			this.refs.ui.refs.home.on('loaded', () => {
				this.Progress.done();

			document.title = 'Misskey'
			this.Progress.start();
			@stream.on 'post' this.on-stream-post
			document.add-event-listener 'visibilitychange' @window-on-visibilitychange, false

		this.on('unmount', () => {
			@stream.off 'post' this.on-stream-post
			document.remove-event-listener 'visibilitychange' @window-on-visibilitychange

		on-stream-post(post) {
			if document.hidden and post.user_id !== @I.id
				@unread-count++
				document.title = '(' + @unread-count + ') ' + @get-post-summary post

		window-on-visibilitychange() {
			if !document.hidden
				this.unread-count = 0
				document.title = 'Misskey'
	</script>
</mk-home-page>

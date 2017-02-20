<mk-timeline-home-widget>
	<mk-following-setuper if={ noFollowing }></mk-following-setuper>
	<div class="loading" if={ isLoading }>
		<mk-ellipsis-icon></mk-ellipsis-icon>
	</div>
	<p class="empty" if={ isEmpty }><i class="fa fa-comments-o"></i>自分の投稿や、自分がフォローしているユーザーの投稿が表示されます。</p>
	<mk-timeline ref="timeline"><yield to="footer"><i class="fa fa-moon-o" if={ !parent.moreLoading }></i><i class="fa fa-spinner fa-pulse fa-fw" if={ parent.moreLoading }></i></yield></mk-timeline>
	<style>
		:scope
			display block
			background #fff

			> mk-following-setuper
				border-bottom solid 1px #eee

			> .loading
				padding 64px 0

			> .empty
				display block
				margin 0 auto
				padding 32px
				max-width 400px
				text-align center
				color #999

				> i
					display block
					margin-bottom 16px
					font-size 3em
					color #ccc

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');
		this.mixin('stream');

		this.is-loading = true
		this.is-empty = false
		this.more-loading = false
		this.no-following = @I.following_count == 0

		this.on('mount', () => {
			@stream.on 'post' this.on-stream-post
			@stream.on 'follow' this.on-stream-follow
			@stream.on 'unfollow' this.on-stream-unfollow

			document.add-event-listener 'keydown' this.on-document-keydown
			window.add-event-listener 'scroll' this.on-scroll

			@load =>
				this.trigger('loaded');

		this.on('unmount', () => {
			@stream.off 'post' this.on-stream-post
			@stream.off 'follow' this.on-stream-follow
			@stream.off 'unfollow' this.on-stream-unfollow

			document.remove-event-listener 'keydown' this.on-document-keydown
			window.remove-event-listener 'scroll' this.on-scroll

		on-document-keydown(e) {
			tag = e.target.tag-name.to-lower-case!
			if tag != 'input' and tag != 'textarea' 
				if e.which == 84 // t
					this.refs.timeline.focus();

		load(cb) {
			this.api 'posts/timeline' 
			.then (posts) =>
				this.is-loading = false
				this.is-empty = posts.length == 0
				this.update();
				this.refs.timeline.set-posts posts
				if cb? then cb!
			.catch (err) =>
				console.error err
				if cb? then cb!

		more() {
			if @more-loading or @is-loading or this.refs.timeline.posts.length == 0
				return
			this.more-loading = true
			this.update();
			this.api 'posts/timeline' do
				max_id: this.refs.timeline.tail!.id
			.then (posts) =>
				this.more-loading = false
				this.update();
				this.refs.timeline.prepend-posts posts
			.catch (err) =>
				console.error err

		on-stream-post(post) {
			this.is-empty = false
			this.update();
			this.refs.timeline.add-post post

		on-stream-follow() {
			@load!

		on-stream-unfollow() {
			@load!

		on-scroll() {
			current = window.scroll-y + window.inner-height
			if current > document.body.offset-height - 8
				@more!
	</script>
</mk-timeline-home-widget>

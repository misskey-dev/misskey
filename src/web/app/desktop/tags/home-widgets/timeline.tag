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
		this.no-following = this.I.following_count == 0

		this.on('mount', () => {
			this.stream.on 'post' this.on-stream-post
			this.stream.on 'follow' this.on-stream-follow
			this.stream.on 'unfollow' this.on-stream-unfollow

			document.addEventListener 'keydown' this.on-document-keydown
			window.addEventListener 'scroll' this.on-scroll

			@load =>
				this.trigger('loaded');

		this.on('unmount', () => {
			this.stream.off 'post' this.on-stream-post
			this.stream.off 'follow' this.on-stream-follow
			this.stream.off 'unfollow' this.on-stream-unfollow

			document.removeEventListener 'keydown' this.on-document-keydown
			window.removeEventListener 'scroll' this.on-scroll

		this.on-document-keydown = (e) => {
			tag = e.target.tag-name.to-lower-case!
			if tag != 'input' and tag != 'textarea' 
				if e.which == 84 // t
					this.refs.timeline.focus();

		this.load = (cb) => {
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

		this.more = () => {
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

		this.on-stream-post = (post) => {
			this.is-empty = false
			this.update();
			this.refs.timeline.add-post post

		this.on-stream-follow = () => {
			@load!

		this.on-stream-unfollow = () => {
			@load!

		this.on-scroll = () => {
			current = window.scroll-y + window.inner-height
			if current > document.body.offset-height - 8
				@more!
	</script>
</mk-timeline-home-widget>

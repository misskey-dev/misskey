<mk-search-posts>
	<div class="loading" if={ isLoading }>
		<mk-ellipsis-icon></mk-ellipsis-icon>
	</div>
	<p class="empty" if={ isEmpty }><i class="fa fa-search"></i>「{ query }」に関する投稿は見つかりませんでした。</p>
	<mk-timeline ref="timeline"><yield to="footer"><i class="fa fa-moon-o" if={ !parent.moreLoading }></i><i class="fa fa-spinner fa-pulse fa-fw" if={ parent.moreLoading }></i></yield></mk-timeline>
	<style>
		:scope
			display block
			background #fff

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
		this.mixin('api');
		this.mixin('get-post-summary');

		this.query = this.opts.query
		this.is-loading = true
		this.is-empty = false
		this.more-loading = false
		this.page = 0

		this.on('mount', () => {
			document.addEventListener 'keydown' this.on-document-keydown
			window.addEventListener 'scroll' this.on-scroll

			this.api 'posts/search' do
				query: @query
			.then (posts) =>
				this.is-loading = false
				this.is-empty = posts.length == 0
				this.update();
				this.refs.timeline.set-posts posts
				this.trigger('loaded');
			.catch (err) =>
				console.error err

		this.on('unmount', () => {
			document.removeEventListener 'keydown' this.on-document-keydown
			window.removeEventListener 'scroll' this.on-scroll

		this.on-document-keydown = (e) => {
			tag = e.target.tag-name.to-lower-case!
			if tag != 'input' and tag != 'textarea' 
				if e.which == 84 // t
					this.refs.timeline.focus();

		this.more = () => {
			if @more-loading or @is-loading or this.timeline.posts.length == 0
				return
			this.more-loading = true
			this.update();
			this.api 'posts/search' do
				query: @query
				page: this.page + 1
			.then (posts) =>
				this.more-loading = false
				this.page++
				this.update();
				this.refs.timeline.prepend-posts posts
			.catch (err) =>
				console.error err

		this.on-scroll = () => {
			current = window.scroll-y + window.inner-height
			if current > document.body.offset-height - 16 // 遊び
				@more!
	</script>
</mk-search-posts>

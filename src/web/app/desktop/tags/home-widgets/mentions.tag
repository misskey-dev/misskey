<mk-mentions-home-widget>
	<header><span data-is-active={ mode == 'all' } onclick={ setMode.bind(this, 'all') }>すべて</span><span data-is-active={ mode == 'following' } onclick={ setMode.bind(this, 'following') }>フォロー中</span></header>
	<div class="loading" if={ isLoading }>
		<mk-ellipsis-icon></mk-ellipsis-icon>
	</div>
	<p class="empty" if={ isEmpty }><i class="fa fa-comments-o"></i><span if={ mode == 'all' }>あなた宛ての投稿はありません。</span><span if={ mode == 'following' }>あなたがフォローしているユーザーからの言及はありません。</span></p>
	<mk-timeline ref="timeline"><yield to="footer"><i class="fa fa-moon-o" if={ !parent.moreLoading }></i><i class="fa fa-spinner fa-pulse fa-fw" if={ parent.moreLoading }></i></yield></mk-timeline>
	<style>
		:scope
			display block
			background #fff

			> header
				padding 8px 16px
				border-bottom solid 1px #eee

				> span
					margin-right 16px
					line-height 27px
					font-size 18px
					color #555

					&:not([data-is-active])
						color $theme-color
						cursor pointer

						&:hover
							text-decoration underline

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

		this.is-loading = true
		this.is-empty = false
		this.more-loading = false
		this.mode = 'all' 

		this.on('mount', () => {
			document.addEventListener 'keydown' this.on-document-keydown
			window.addEventListener 'scroll' this.on-scroll

			@fetch =>
				this.trigger('loaded');

		this.on('unmount', () => {
			document.removeEventListener 'keydown' this.on-document-keydown
			window.removeEventListener 'scroll' this.on-scroll

		this.on-document-keydown = (e) => {
			tag = e.target.tag-name.to-lower-case!
			if tag != 'input' and tag != 'textarea' 
				if e.which == 84 // t
					this.refs.timeline.focus();

		this.fetch = (cb) => {
			this.api 'posts/mentions' do
				following: this.mode == 'following' 
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
			this.api 'posts/mentions' do
				following: this.mode == 'following' 
				max_id: this.refs.timeline.tail!.id
			.then (posts) =>
				this.more-loading = false
				this.update();
				this.refs.timeline.prepend-posts posts
			.catch (err) =>
				console.error err

		this.on-scroll = () => {
			current = window.scroll-y + window.inner-height
			if current > document.body.offset-height - 8
				@more!

		this.set-mode = (mode) => {
			@update do
				mode: mode
			@fetch!
	</script>
</mk-mentions-home-widget>

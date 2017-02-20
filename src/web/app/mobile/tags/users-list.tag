<mk-users-list>
	<nav><span data-is-active={ mode == 'all' } onclick={ setMode.bind(this, 'all') }>すべて<span>{ opts.count }</span></span>
		<!-- ↓ https://github.com/riot/riot/issues/2080--><span if={ SIGNIN && opts.youKnowCount != '' } data-is-active={ mode == 'iknow' } onclick={ setMode.bind(this, 'iknow') }>知り合い<span>{ opts.youKnowCount }</span></span>
	</nav>
	<div class="users" if={ !fetching && users.length != 0 }>
		<mk-user-preview each={ users } user={ this }></mk-user-preview>
	</div>
	<button class="more" if={ !fetching && next != null } onclick={ more } disabled={ moreFetching }><span if={ !moreFetching }>もっと</span><span if={ moreFetching }>読み込み中
			<mk-ellipsis></mk-ellipsis></span></button>
	<p class="no" if={ !fetching && users.length == 0 }>{ opts.noUsers }</p>
	<p class="fetching" if={ fetching }><i class="fa fa-spinner fa-pulse fa-fw"></i>読み込んでいます
		<mk-ellipsis></mk-ellipsis>
	</p>
	<style>
		:scope
			display block
			background #fff

			> nav
				display flex
				justify-content center
				margin 0 auto
				max-width 600px
				border-bottom solid 1px #ddd

				> span
					display block
					flex 1 1
					text-align center
					line-height 52px
					font-size 14px
					color #657786
					border-bottom solid 2px transparent

					&[data-is-active]
						font-weight bold
						color $theme-color
						border-color $theme-color

					> span
						display inline-block
						margin-left 4px
						padding 2px 5px
						font-size 12px
						line-height 1
						color #888
						background #eee
						border-radius 20px

			> .users
				> *
					max-width 600px
					margin 0 auto
					border-bottom solid 1px rgba(0, 0, 0, 0.05)

			> .no
				margin 0
				padding 16px
				text-align center
				color #aaa

			> .fetching
				margin 0
				padding 16px
				text-align center
				color #aaa

				> i
					margin-right 4px

	</style>
	<script>
		this.mixin('i');

		this.limit = 30users
		this.mode = 'all' 

		this.fetching = true
		this.more-fetching = false

		this.on('mount', () => {
			@fetch =>
				this.trigger('loaded');

		this.fetch = (cb) => {
			this.fetching = true
			this.update();
			obj <~ this.opts.fetch do
				this.mode == 'iknow' 
				@limit
				null
			this.users = obj.users
			this.next = obj.next
			this.fetching = false
			this.update();
			if cb? then cb!

		this.more = () => {
			this.more-fetching = true
			this.update();
			obj <~ this.opts.fetch do
				this.mode == 'iknow' 
				@limit
				@cursor
			this.users = @users.concat obj.users
			this.next = obj.next
			this.more-fetching = false
			this.update();

		this.set-mode = (mode) => {
			@update do
				mode: mode

			@fetch!
	</script>
</mk-users-list>

<mk-users-list>
	<nav>
		<span data-is-active={ mode == 'all' } onclick={ setMode.bind(this, 'all') }>%i18n:mobile.tags.mk-users-list.all%<span>{ opts.count }</span></span>
		<span if={ SIGNIN && opts.youKnowCount } data-is-active={ mode == 'iknow' } onclick={ setMode.bind(this, 'iknow') }>%i18n:mobile.tags.mk-users-list.known%<span>{ opts.youKnowCount }</span></span>
	</nav>
	<div class="users" if={ !fetching && users.length != 0 }>
		<mk-user-preview each={ users } user={ this }/>
	</div>
	<button class="more" if={ !fetching && next != null } onclick={ more } disabled={ moreFetching }>
		<span if={ !moreFetching }>%i18n:mobile.tags.mk-users-list.load-more%</span>
		<span if={ moreFetching }>%i18n:common.loading%<mk-ellipsis/></span></button>
	<p class="no" if={ !fetching && users.length == 0 }>{ opts.noUsers }</p>
	<p class="fetching" if={ fetching }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:common.loading%<mk-ellipsis/></p>
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

		this.limit = 30;
		this.mode = 'all';

		this.fetching = true;
		this.moreFetching = false;

		this.on('mount', () => {
			this.fetch(() => this.trigger('loaded'));
		});

		this.fetch = cb => {
			this.update({
				fetching: true
			});
			this.opts.fetch(this.mode == 'iknow', this.limit, null, obj => {
				this.update({
					fetching: false,
					users: obj.users,
					next: obj.next
				});
				if (cb) cb();
			});
		};

		this.more = () => {
			this.update({
				moreFetching: true
			});
			this.opts.fetch(this.mode == 'iknow', this.limit, this.next, obj => {
				this.update({
					moreFetching: false,
					users: this.users.concat(obj.users),
					next: obj.next
				});
			});
		};

		this.setMode = mode => {
			this.update({
				mode: mode
			});
			this.fetch();
		};
	</script>
</mk-users-list>

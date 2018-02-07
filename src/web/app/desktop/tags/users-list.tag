<mk-users-list>
	<nav>
		<div>
			<span data-is-active={ mode == 'all' } @click="setMode.bind(this, 'all')">すべて<span>{ opts.count }</span></span>
			<span if={ SIGNIN && opts.youKnowCount } data-is-active={ mode == 'iknow' } @click="setMode.bind(this, 'iknow')">知り合い<span>{ opts.youKnowCount }</span></span>
		</div>
	</nav>
	<div class="users" if={ !fetching && users.length != 0 }>
		<div each={ users }>
			<mk-list-user user={ this }/>
		</div>
	</div>
	<button class="more" if={ !fetching && next != null } @click="more" disabled={ moreFetching }>
		<span if={ !moreFetching }>もっと</span>
		<span if={ moreFetching }>読み込み中<mk-ellipsis/></span>
	</button>
	<p class="no" if={ !fetching && users.length == 0 }>{ opts.noUsers }</p>
	<p class="fetching" if={ fetching }>%fa:spinner .pulse .fw%読み込んでいます<mk-ellipsis/></p>
	<style>
		:scope
			display block
			height 100%
			background #fff

			> nav
				z-index 1
				box-shadow 0 1px 0 rgba(#000, 0.1)

				> div
					display flex
					justify-content center
					margin 0 auto
					max-width 600px

					> span
						display block
						flex 1 1
						text-align center
						line-height 52px
						font-size 14px
						color #657786
						border-bottom solid 2px transparent
						cursor pointer

						*
							pointer-events none

						&[data-is-active]
							font-weight bold
							color $theme-color
							border-color $theme-color
							cursor default

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
				height calc(100% - 54px)
				overflow auto

				> *
					border-bottom solid 1px rgba(0, 0, 0, 0.05)

					> *
						max-width 600px
						margin 0 auto

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

				> [data-fa]
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
			this.opts.fetch(this.mode == 'iknow', this.limit, this.cursor, obj => {
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

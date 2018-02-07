<mk-users-list>
	<nav>
		<span data-is-active={ mode == 'all' } @click="setMode.bind(this, 'all')">%i18n:mobile.tags.mk-users-list.all%<span>{ opts.count }</span></span>
		<span v-if="SIGNIN && opts.youKnowCount" data-is-active={ mode == 'iknow' } @click="setMode.bind(this, 'iknow')">%i18n:mobile.tags.mk-users-list.known%<span>{ opts.youKnowCount }</span></span>
	</nav>
	<div class="users" v-if="!fetching && users.length != 0">
		<mk-user-preview each={ users } user={ this }/>
	</div>
	<button class="more" v-if="!fetching && next != null" @click="more" disabled={ moreFetching }>
		<span v-if="!moreFetching">%i18n:mobile.tags.mk-users-list.load-more%</span>
		<span v-if="moreFetching">%i18n:common.loading%<mk-ellipsis/></span></button>
	<p class="no" v-if="!fetching && users.length == 0">{ opts.noUsers }</p>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<style lang="stylus" scoped>
		:scope
			display block

			> nav
				display flex
				justify-content center
				margin 0 auto
				max-width 600px
				border-bottom solid 1px rgba(0, 0, 0, 0.2)

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
						color #fff
						background rgba(0, 0, 0, 0.3)
						border-radius 20px

			> .users
				margin 8px auto
				max-width 500px
				width calc(100% - 16px)
				background #fff
				border-radius 8px
				box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

				@media (min-width 500px)
					margin 16px auto
					width calc(100% - 32px)

				> *
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

				> [data-fa]
					margin-right 4px

	</style>
	<script lang="typescript">
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

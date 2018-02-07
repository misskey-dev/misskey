<mk-init-following>
	<p class="title">気になるユーザーをフォロー:</p>
	<div class="users" v-if="!fetching && users.length > 0">
		<virtual each={ users }>
			<mk-user-card user={ this } />
		</virtual>
	</div>
	<p class="empty" v-if="!fetching && users.length == 0">おすすめのユーザーは見つかりませんでした。</p>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%読み込んでいます<mk-ellipsis/></p>
	<a class="refresh" @click="refresh">もっと見る</a>
	<button class="close" @click="close" title="閉じる">%fa:times%</button>
	<style lang="stylus" scoped>
		:scope
			display block
			background #fff
			border-radius 8px
			box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

			> .title
				margin 0
				padding 8px 16px
				font-size 1em
				font-weight bold
				color #888

			> .users
				overflow-x scroll
				-webkit-overflow-scrolling touch
				white-space nowrap
				padding 16px
				background #eee

				> mk-user-card
					&:not(:last-child)
						margin-right 16px

			> .empty
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

			> .refresh
				display block
				margin 0
				padding 8px 16px
				text-align right
				font-size 0.9em
				color #999

			> .close
				cursor pointer
				display block
				position absolute
				top 0
				right 0
				z-index 1
				margin 0
				padding 0
				font-size 1.2em
				color #999
				border none
				outline none
				background transparent

				&:hover
					color #555

				&:active
					color #222

				> [data-fa]
					padding 10px

	</style>
	<script>
		this.mixin('api');

		this.users = null;
		this.fetching = true;

		this.limit = 6;
		this.page = 0;

		this.on('mount', () => {
			this.fetch();
		});

		this.fetch = () => {
			this.update({
				fetching: true,
				users: null
			});

			this.api('users/recommendation', {
				limit: this.limit,
				offset: this.limit * this.page
			}).then(users => {
				this.fetching = false
				this.users = users
				this.update({
					fetching: false,
					users: users
				});
			});
		};

		this.refresh = () => {
			if (this.users.length < this.limit) {
				this.page = 0;
			} else {
				this.page++;
			}
			this.fetch();
		};

		this.close = () => {
			this.$destroy();
		};
	</script>
</mk-init-following>

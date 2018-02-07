<mk-autocomplete-suggestion>
	<ol class="users" ref="users" v-if="users.length > 0">
		<li each={ users } @click="parent.onClick" onkeydown={ parent.onKeydown } tabindex="-1">
			<img class="avatar" src={ avatar_url + '?thumbnail&size=32' } alt=""/>
			<span class="name">{ name }</span>
			<span class="username">@{ username }</span>
		</li>
	</ol>
	<style lang="stylus" scoped>
		:scope
			display block
			position absolute
			z-index 65535
			margin-top calc(1em + 8px)
			overflow hidden
			background #fff
			border solid 1px rgba(0, 0, 0, 0.1)
			border-radius 4px

			> .users
				display block
				margin 0
				padding 4px 0
				max-height 190px
				max-width 500px
				overflow auto
				list-style none

				> li
					display block
					padding 4px 12px
					white-space nowrap
					overflow hidden
					font-size 0.9em
					color rgba(0, 0, 0, 0.8)
					cursor default

					&, *
						user-select none

					&:hover
					&[data-selected='true']
						color #fff
						background $theme-color

						.name
							color #fff

						.username
							color #fff

					&:active
						color #fff
						background darken($theme-color, 10%)

						.name
							color #fff

						.username
							color #fff

					.avatar
						vertical-align middle
						min-width 28px
						min-height 28px
						max-width 28px
						max-height 28px
						margin 0 8px 0 0
						border-radius 100%

					.name
						margin 0 8px 0 0
						/*font-weight bold*/
						font-weight normal
						color rgba(0, 0, 0, 0.8)

					.username
						font-weight normal
						color rgba(0, 0, 0, 0.3)

	</style>
	<script>
		import contains from '../../common/scripts/contains';

		this.mixin('api');

		this.q = this.opts.q;
		this.textarea = this.opts.textarea;
		this.fetching = true;
		this.users = [];
		this.select = -1;

		this.on('mount', () => {
			this.textarea.addEventListener('keydown', this.onKeydown);

			document.querySelectorAll('body *').forEach(el => {
				el.addEventListener('mousedown', this.mousedown);
			});

			this.api('users/search_by_username', {
				query: this.q,
				limit: 30
			}).then(users => {
				this.update({
					fetching: false,
					users: users
				});
			});
		});

		this.on('unmount', () => {
			this.textarea.removeEventListener('keydown', this.onKeydown);

			document.querySelectorAll('body *').forEach(el => {
				el.removeEventListener('mousedown', this.mousedown);
			});
		});

		this.mousedown = e => {
			if (!contains(this.root, e.target) && (this.root != e.target)) this.close();
		};

		this.onClick = e => {
			this.complete(e.item);
		};

		this.onKeydown = e => {
			const cancel = () => {
				e.preventDefault();
				e.stopPropagation();
			};

			switch (e.which) {
				case 10: // [ENTER]
				case 13: // [ENTER]
					if (this.select !== -1) {
						cancel();
						this.complete(this.users[this.select]);
					} else {
						this.close();
					}
					break;

				case 27: // [ESC]
					cancel();
					this.close();
					break;

				case 38: // [↑]
					if (this.select !== -1) {
						cancel();
						this.selectPrev();
					} else {
						this.close();
					}
					break;

				case 9: // [TAB]
				case 40: // [↓]
					cancel();
					this.selectNext();
					break;

				default:
					this.close();
			}
		};

		this.selectNext = () => {
			if (++this.select >= this.users.length) this.select = 0;
			this.applySelect();
		};

		this.selectPrev = () => {
			if (--this.select < 0) this.select = this.users.length - 1;
			this.applySelect();
		};

		this.applySelect = () => {
			Array.from(this.$refs.users.children).forEach(el => {
				el.removeAttribute('data-selected');
			});

			this.$refs.users.children[this.select].setAttribute('data-selected', 'true');
			this.$refs.users.children[this.select].focus();
		};

		this.complete = user => {
			this.opts.complete(user);
		};

		this.close = () => {
			this.opts.close();
		};

	</script>
</mk-autocomplete-suggestion>

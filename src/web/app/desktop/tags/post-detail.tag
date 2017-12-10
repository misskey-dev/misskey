<mk-post-detail title={ title }>
	<div class="main">
		<button class="read-more" if={ p.reply && p.reply.reply_id && context == null } title="会話をもっと読み込む" onclick={ loadContext } disabled={ contextFetching }>
			<virtual if={ !contextFetching }>%fa:ellipsis-v%</virtual>
			<virtual if={ contextFetching }>%fa:spinner .pulse%</virtual>
		</button>
		<div class="context">
			<virtual each={ post in context }>
				<mk-post-detail-sub post={ post }/>
			</virtual>
		</div>
		<div class="reply-to" if={ p.reply }>
			<mk-post-detail-sub post={ p.reply }/>
		</div>
		<div class="repost" if={ isRepost }>
			<p>
				<a class="avatar-anchor" href={ '/' + post.user.username } data-user-preview={ post.user_id }>
					<img class="avatar" src={ post.user.avatar_url + '?thumbnail&size=32' } alt="avatar"/>
				</a>
				%fa:retweet%<a class="name" href={ '/' + post.user.username }>
				{ post.user.name }
			</a>
			がRepost
		</p>
		</div>
		<article>
			<a class="avatar-anchor" href={ '/' + p.user.username }>
				<img class="avatar" src={ p.user.avatar_url + '?thumbnail&size=64' } alt="avatar" data-user-preview={ p.user.id }/>
			</a>
			<header>
				<a class="name" href={ '/' + p.user.username } data-user-preview={ p.user.id }>{ p.user.name }</a>
				<span class="username">@{ p.user.username }</span>
				<a class="time" href={ '/' + p.user.username + '/' + p.id }>
					<mk-time time={ p.created_at }/>
				</a>
			</header>
			<div class="body">
				<div class="text" ref="text"></div>
				<div class="media" if={ p.media }>
					<mk-images-viewer images={ p.media }/>
				</div>
				<mk-poll if={ p.poll } post={ p }/>
			</div>
			<footer>
				<mk-reactions-viewer post={ p }/>
				<button onclick={ reply } title="返信">
					%fa:reply%<p class="count" if={ p.replies_count > 0 }>{ p.replies_count }</p>
				</button>
				<button onclick={ repost } title="Repost">
					%fa:retweet%<p class="count" if={ p.repost_count > 0 }>{ p.repost_count }</p>
				</button>
				<button class={ reacted: p.my_reaction != null } onclick={ react } ref="reactButton" title="リアクション">
					%fa:plus%<p class="count" if={ p.reactions_count > 0 }>{ p.reactions_count }</p>
				</button>
				<button onclick={ menu } ref="menuButton">
					%fa:ellipsis-h%
				</button>
			</footer>
		</article>
		<div class="replies" if={ !compact }>
			<virtual each={ post in replies }>
				<mk-post-detail-sub post={ post }/>
			</virtual>
		</div>
	</div>
	<style>
		:scope
			display block
			margin 0
			padding 0
			overflow hidden
			text-align left
			background #fff
			border solid 1px rgba(0, 0, 0, 0.1)
			border-radius 8px

			> .main

				> .read-more
					display block
					margin 0
					padding 10px 0
					width 100%
					font-size 1em
					text-align center
					color #999
					cursor pointer
					background #fafafa
					outline none
					border none
					border-bottom solid 1px #eef0f2
					border-radius 6px 6px 0 0

					&:hover
						background #f6f6f6

					&:active
						background #f0f0f0

					&:disabled
						color #ccc

				> .context
					> *
						border-bottom 1px solid #eef0f2

				> .repost
					color #9dbb00
					background linear-gradient(to bottom, #edfde2 0%, #fff 100%)

					> p
						margin 0
						padding 16px 32px

						.avatar-anchor
							display inline-block

							.avatar
								vertical-align bottom
								min-width 28px
								min-height 28px
								max-width 28px
								max-height 28px
								margin 0 8px 0 0
								border-radius 6px

						[data-fa]
							margin-right 4px

						.name
							font-weight bold

					& + article
						padding-top 8px

				> .reply-to
					border-bottom 1px solid #eef0f2

				> article
					padding 28px 32px 18px 32px

					&:after
						content ""
						display block
						clear both

					&:hover
						> .main > footer > button
							color #888

					> .avatar-anchor
						display block
						width 60px
						height 60px

						> .avatar
							display block
							width 60px
							height 60px
							margin 0
							border-radius 8px
							vertical-align bottom

					> header
						position absolute
						top 28px
						left 108px
						width calc(100% - 108px)

						> .name
							display inline-block
							margin 0
							line-height 24px
							color #777
							font-size 18px
							font-weight 700
							text-align left
							text-decoration none

							&:hover
								text-decoration underline

						> .username
							display block
							text-align left
							margin 0
							color #ccc

						> .time
							position absolute
							top 0
							right 32px
							font-size 1em
							color #c0c0c0

					> .body
						padding 8px 0

						> .text
							cursor default
							display block
							margin 0
							padding 0
							overflow-wrap break-word
							font-size 1.5em
							color #717171

							> mk-url-preview
								margin-top 8px

					> footer
						font-size 1.2em

						> button
							margin 0 28px 0 0
							padding 8px
							background transparent
							border none
							font-size 1em
							color #ddd
							cursor pointer

							&:hover
								color #666

							> .count
								display inline
								margin 0 0 0 8px
								color #999

							&.reacted
								color $theme-color

				> .replies
					> *
						border-top 1px solid #eef0f2

	</style>
	<script>
		import compile from '../../common/scripts/text-compiler';
		import dateStringify from '../../common/scripts/date-stringify';

		this.mixin('api');
		this.mixin('user-preview');

		this.compact = this.opts.compact;
		this.contextFetching = false;
		this.context = null;
		this.post = this.opts.post;
		this.isRepost = this.post.repost != null;
		this.p = this.isRepost ? this.post.repost : this.post;
		this.p.reactions_count = this.p.reaction_counts ? Object.keys(this.p.reaction_counts).map(key => this.p.reaction_counts[key]).reduce((a, b) => a + b) : 0;
		this.title = dateStringify(this.p.created_at);

		this.on('mount', () => {
			if (this.p.text) {
				const tokens = this.p.ast;

				this.refs.text.innerHTML = compile(tokens);

				Array.from(this.refs.text.children).forEach(e => {
					if (e.tagName == 'MK-URL') riot.mount(e);
				});

				// URLをプレビュー
				tokens
				.filter(t => (t.type == 'url' || t.type == 'link') && !t.silent)
				.map(t => {
					riot.mount(this.refs.text.appendChild(document.createElement('mk-url-preview')), {
						url: t.url
					});
				});
			}

			// Get replies
			if (!this.compact) {
				this.api('posts/replies', {
					post_id: this.p.id,
					limit: 8
				}).then(replies => {
					this.update({
						replies: replies
					});
				});
			}
		});

		this.reply = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-post-form-window')), {
				reply: this.p
			});
		};

		this.repost = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-repost-form-window')), {
				post: this.p
			});
		};

		this.react = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-reaction-picker')), {
				source: this.refs.reactButton,
				post: this.p
			});
		};

		this.menu = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-post-menu')), {
				source: this.refs.menuButton,
				post: this.p
			});
		};

		this.loadContext = () => {
			this.contextFetching = true;

			// Fetch context
			this.api('posts/context', {
				post_id: this.p.reply_id
			}).then(context => {
				this.update({
					contextFetching: false,
					context: context.reverse()
				});
			});
		};
	</script>
</mk-post-detail>

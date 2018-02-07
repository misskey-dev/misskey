<mk-post-detail>
	<button class="read-more" if={ p.reply && p.reply.reply_id && context == null } @click="loadContext" disabled={ loadingContext }>
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
			<a class="avatar-anchor" href={ '/' + post.user.username }>
				<img class="avatar" src={ post.user.avatar_url + '?thumbnail&size=32' } alt="avatar"/></a>
				%fa:retweet%<a class="name" href={ '/' + post.user.username }>
				{ post.user.name }
			</a>
			がRepost
		</p>
	</div>
	<article>
		<header>
			<a class="avatar-anchor" href={ '/' + p.user.username }>
				<img class="avatar" src={ p.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
			</a>
			<div>
				<a class="name" href={ '/' + p.user.username }>{ p.user.name }</a>
				<span class="username">@{ p.user.username }</span>
			</div>
		</header>
		<div class="body">
			<div class="text" ref="text"></div>
			<div class="media" if={ p.media }>
				<mk-images images={ p.media }/>
			</div>
			<mk-poll if={ p.poll } post={ p }/>
		</div>
		<a class="time" href={ '/' + p.user.username + '/' + p.id }>
			<mk-time time={ p.created_at } mode="detail"/>
		</a>
		<footer>
			<mk-reactions-viewer post={ p }/>
			<button @click="reply" title="%i18n:mobile.tags.mk-post-detail.reply%">
				%fa:reply%<p class="count" if={ p.replies_count > 0 }>{ p.replies_count }</p>
			</button>
			<button @click="repost" title="Repost">
				%fa:retweet%<p class="count" if={ p.repost_count > 0 }>{ p.repost_count }</p>
			</button>
			<button class={ reacted: p.my_reaction != null } @click="react" ref="reactButton" title="%i18n:mobile.tags.mk-post-detail.reaction%">
				%fa:plus%<p class="count" if={ p.reactions_count > 0 }>{ p.reactions_count }</p>
			</button>
			<button @click="menu" ref="menuButton">
				%fa:ellipsis-h%
			</button>
		</footer>
	</article>
	<div class="replies" if={ !compact }>
		<virtual each={ post in replies }>
			<mk-post-detail-sub post={ post }/>
		</virtual>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
			overflow hidden
			margin 0 auto
			padding 0
			width 100%
			text-align left
			background #fff
			border-radius 8px
			box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

			> .fetching
				padding 64px 0

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
				box-shadow none

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
				padding 14px 16px 9px 16px

				@media (min-width 500px)
					padding 28px 32px 18px 32px

				&:after
					content ""
					display block
					clear both

				&:hover
					> .main > footer > button
						color #888

				> header
					display flex
					line-height 1.1

					> .avatar-anchor
						display block
						padding 0 .5em 0 0

						> .avatar
							display block
							width 54px
							height 54px
							margin 0
							border-radius 8px
							vertical-align bottom

							@media (min-width 500px)
								width 60px
								height 60px

					> div

						> .name
							display inline-block
							margin .4em 0
							color #777
							font-size 16px
							font-weight bold
							text-align left
							text-decoration none

							&:hover
								text-decoration underline

						> .username
							display block
							text-align left
							margin 0
							color #ccc

				> .body
					padding 8px 0

					> .text
						cursor default
						display block
						margin 0
						padding 0
						overflow-wrap break-word
						font-size 16px
						color #717171

						@media (min-width 500px)
							font-size 24px

						> mk-url-preview
							margin-top 8px

					> .media
						> img
							display block
							max-width 100%

				> .time
					font-size 16px
					color #c0c0c0

				> footer
					font-size 1.2em

					> button
						margin 0
						padding 8px
						background transparent
						border none
						box-shadow none
						font-size 1em
						color #ddd
						cursor pointer

						&:not(:last-child)
							margin-right 28px

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
		import getPostSummary from '../../../../common/get-post-summary.ts';
		import openPostForm from '../scripts/open-post-form';

		this.mixin('api');

		this.compact = this.opts.compact;
		this.post = this.opts.post;
		this.isRepost = this.post.repost != null;
		this.p = this.isRepost ? this.post.repost : this.post;
		this.p.reactions_count = this.p.reaction_counts ? Object.keys(this.p.reaction_counts).map(key => this.p.reaction_counts[key]).reduce((a, b) => a + b) : 0;
		this.summary = getPostSummary(this.p);

		this.loadingContext = false;
		this.context = null;

		this.on('mount', () => {
			if (this.p.text) {
				const tokens = this.p.ast;

				this.$refs.text.innerHTML = compile(tokens);

				Array.from(this.$refs.text.children).forEach(e => {
					if (e.tagName == 'MK-URL') riot.mount(e);
				});

				// URLをプレビュー
				tokens
				.filter(t => (t.type == 'url' || t.type == 'link') && !t.silent)
				.map(t => {
					riot.mount(this.$refs.text.appendChild(document.createElement('mk-url-preview')), {
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
			openPostForm({
				reply: this.p
			});
		};

		this.repost = () => {
			const text = window.prompt(`「${this.summary}」をRepost`);
			if (text == null) return;
			this.api('posts/create', {
				repost_id: this.p.id,
				text: text == '' ? undefined : text
			});
		};

		this.react = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-reaction-picker')), {
				source: this.$refs.reactButton,
				post: this.p,
				compact: true
			});
		};

		this.menu = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-post-menu')), {
				source: this.$refs.menuButton,
				post: this.p,
				compact: true
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

<mk-post-detail-sub>
	<article>
		<a class="avatar-anchor" href={ '/' + post.user.username }>
			<img class="avatar" src={ post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="main">
			<header>
				<a class="name" href={ '/' + post.user.username }>{ post.user.name }</a>
				<span class="username">@{ post.user.username }</span>
				<a class="time" href={ '/' + post.user.username + '/' + post.id }>
					<mk-time time={ post.created_at }/>
				</a>
			</header>
			<div class="body">
				<mk-sub-post-content class="text" post={ post }/>
			</div>
		</div>
	</article>
	<style lang="stylus" scoped>
		:scope
			display block
			margin 0
			padding 8px
			font-size 0.9em
			background #fdfdfd

			@media (min-width 500px)
				padding 12px

			> article
				&:after
					content ""
					display block
					clear both

				&:hover
					> .main > footer > button
						color #888

				> .avatar-anchor
					display block
					float left
					margin 0 12px 0 0

					> .avatar
						display block
						width 48px
						height 48px
						margin 0
						border-radius 8px
						vertical-align bottom

				> .main
					float left
					width calc(100% - 60px)

					> header
						display flex
						margin-bottom 4px
						white-space nowrap

						> .name
							display block
							margin 0 .5em 0 0
							padding 0
							overflow hidden
							color #607073
							font-size 1em
							font-weight 700
							text-align left
							text-decoration none
							text-overflow ellipsis

							&:hover
								text-decoration underline

						> .username
							text-align left
							margin 0 .5em 0 0
							color #d1d8da

						> .time
							margin-left auto
							color #b2b8bb

					> .body

						> .text
							cursor default
							margin 0
							padding 0
							font-size 1.1em
							color #717171

	</style>
	<script>this.post = this.opts.post</script>
</mk-post-detail-sub>

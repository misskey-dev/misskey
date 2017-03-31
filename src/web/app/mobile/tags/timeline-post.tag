<mk-timeline-post class={ repost: isRepost }>
	<div class="reply-to" if={ p.reply_to }>
		<mk-timeline-post-sub post={ p.reply_to }></mk-timeline-post-sub>
	</div>
	<div class="repost" if={ isRepost }>
		<p>
			<a class="avatar-anchor" href={ CONFIG.url + '/' + post.user.username }>
				<img class="avatar" src={ post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
			</a>
			<i class="fa fa-retweet"></i>
			<a class="name" href={ CONFIG.url + '/' + post.user.username }>{ '%i18n:mobile.tags.mk-timeline-post.reposted-by%'.replace('{}', post.user.name) }</a>
		</p>
		<mk-time time={ post.created_at }></mk-time>
	</div>
	<article>
		<a class="avatar-anchor" href={ CONFIG.url + '/' + p.user.username }>
			<img class="avatar" src={ p.user.avatar_url + '?thumbnail&size=96' } alt="avatar"/>
		</a>
		<div class="main">
			<header>
				<a class="name" href={ CONFIG.url + '/' + p.user.username }>{ p.user.name }</a>
				<span class="is-bot" if={ p.user.is_bot }>bot</span>
				<span class="username">@{ p.user.username }</span>
				<a class="created-at" href={ url }>
					<mk-time time={ p.created_at }></mk-time>
				</a>
			</header>
			<div class="body">
				<div class="text" ref="text">
					<a class="reply" if={ p.reply_to }>
						<i class="fa fa-reply"></i>
					</a>
					<p class="dummy"></p>
					<a class="quote" if={ p.repost != null }>RP:</a>
				</div>
				<div class="media" if={ p.media }>
					<mk-images-viewer images={ p.media }></mk-images-viewer>
				</div>
				<mk-poll if={ p.poll } post={ p } ref="pollViewer"></mk-poll>
				<span class="app" if={ p.app }>via <b>{ p.app.name }</b></span>
				<div class="repost" if={ p.repost }><i class="fa fa-quote-right fa-flip-horizontal"></i>
					<mk-post-preview class="repost" post={ p.repost }></mk-post-preview>
				</div>
			</div>
			<footer>
				<mk-reactions-viewer post={ p } ref="reactionsViewer"></mk-reactions-viewer>
				<button onclick={ reply }><i class="fa fa-reply"></i>
					<p class="count" if={ p.replies_count > 0 }>{ p.replies_count }</p>
				</button>
				<button onclick={ repost } title="Repost"><i class="fa fa-retweet"></i>
					<p class="count" if={ p.repost_count > 0 }>{ p.repost_count }</p>
				</button>
				<button class={ reacted: p.my_reaction != null } onclick={ react } ref="reactButton"><i class="fa fa-plus"></i>
					<p class="count" if={ p.reactions_count > 0 }>{ p.reactions_count }</p>
				</button>
			</footer>
		</div>
	</article>
	<style>
		:scope
			display block
			margin 0
			padding 0
			font-size 12px

			@media (min-width 350px)
				font-size 14px

			@media (min-width 500px)
				font-size 16px

			> .repost
				color #9dbb00
				background linear-gradient(to bottom, #edfde2 0%, #fff 100%)

				> p
					margin 0
					padding 8px 16px
					line-height 28px

					@media (min-width 500px)
						padding 16px

					.avatar-anchor
						display inline-block

						.avatar
							vertical-align bottom
							width 28px
							height 28px
							margin 0 8px 0 0
							border-radius 6px

					i
						margin-right 4px

					.name
						font-weight bold

				> mk-time
					position absolute
					top 8px
					right 16px
					font-size 0.9em
					line-height 28px

					@media (min-width 500px)
						top 16px

				& + article
					padding-top 8px

			> .reply-to
				background rgba(0, 0, 0, 0.0125)

				> mk-post-preview
					background transparent

			> article
				padding 14px 16px 9px 16px

				&:after
					content ""
					display block
					clear both

				> .avatar-anchor
					display block
					float left
					margin 0 10px 8px 0
					position -webkit-sticky
					position sticky
					top 62px

					@media (min-width 500px)
						margin-right 16px

					> .avatar
						display block
						width 48px
						height 48px
						margin 0
						border-radius 6px
						vertical-align bottom

						@media (min-width 500px)
							width 58px
							height 58px
							border-radius 8px

				> .main
					float left
					width calc(100% - 58px)

					@media (min-width 500px)
						width calc(100% - 74px)

					> header
						display flex
						white-space nowrap

						@media (min-width 500px)
							margin-bottom 2px

						> .name
							display block
							margin 0 0.5em 0 0
							padding 0
							overflow hidden
							color #777
							font-size 1em
							font-weight 700
							text-align left
							text-decoration none
							text-overflow ellipsis

							&:hover
								text-decoration underline

						> .is-bot
							text-align left
							margin 0 0.5em 0 0
							padding 1px 6px
							font-size 12px
							color #aaa
							border solid 1px #ddd
							border-radius 3px

						> .username
							text-align left
							margin 0 0.5em 0 0
							color #ccc

						> .created-at
							margin-left auto
							font-size 0.9em
							color #c0c0c0

					> .body

						> .text
							cursor default
							display block
							margin 0
							padding 0
							overflow-wrap break-word
							font-size 1.1em
							color #717171

							> .dummy
								display none

							.link
								&:after
									content "\f14c"
									display inline-block
									padding-left 2px
									font-family FontAwesome
									font-size .9em
									font-weight 400
									font-style normal

							mk-url-preview
								margin-top 8px

							> .reply
								margin-right 8px
								color #717171

							> .quote
								margin-left 4px
								font-style oblique
								color #a0bf46

							code
								padding 4px 8px
								margin 0 0.5em
								font-size 80%
								color #525252
								background #f8f8f8
								border-radius 2px

							pre > code
								padding 16px
								margin 0

							[data-is-me]:after
								content "you"
								padding 0 4px
								margin-left 4px
								font-size 80%
								color $theme-color-foreground
								background $theme-color
								border-radius 4px

						> .media
							> img
								display block
								max-width 100%

						> .app
							font-size 12px
							color #ccc

						> mk-poll
							font-size 80%

						> .repost
							margin 8px 0

							> i:first-child
								position absolute
								top -8px
								left -8px
								z-index 1
								color #c0dac6
								font-size 28px
								background #fff

							> mk-post-preview
								padding 16px
								border dashed 1px #c0dac6
								border-radius 8px

					> footer
						> button
							margin 0 28px 0 0
							padding 8px
							background transparent
							border none
							box-shadow none
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

	</style>
	<script>
		import compile from '../../common/scripts/text-compiler';
		import getPostSummary from '../../common/scripts/get-post-summary';
		import openPostForm from '../scripts/open-post-form';

		this.mixin('api');
		this.mixin('stream');

		this.set = post => {
			this.post = post;
			this.isRepost = this.post.repost != null && this.post.text == null;
			this.p = this.isRepost ? this.post.repost : this.post;
			this.p.reactions_count = this.p.reaction_counts ? Object.keys(this.p.reaction_counts).map(key => this.p.reaction_counts[key]).reduce((a, b) => a + b) : 0;
			this.summary = getPostSummary(this.p);
			this.url = `/${this.p.user.username}/${this.p.id}`;
		};

		this.set(this.opts.post);

		this.refresh = post => {
			this.set(post);
			this.update();
			if (this.refs.reactionsViewer) this.refs.reactionsViewer.update({
				post
			});
			if (this.refs.pollViewer) this.refs.pollViewer.init(post);
		};

		this.onStreamPostUpdated = data => {
			const post = data.post;
			if (post.id == this.post.id) {
				this.refresh(post);
			}
		};

		this.onStreamConnected = () => {
			this.capture();
		};

		this.capture = withHandler => {
			this.stream.send({
				type: 'capture',
				id: this.post.id
			});
			if (withHandler) this.stream.on('post-updated', this.onStreamPostUpdated);
		};

		this.decapture = withHandler => {
			this.stream.send({
				type: 'decapture',
				id: this.post.id
			});
			if (withHandler) this.stream.off('post-updated', this.onStreamPostUpdated);
		};

		this.on('mount', () => {
			this.capture(true);
			this.stream.on('_connected_', this.onStreamConnected);

			if (this.p.text) {
				const tokens = this.p.ast;

				this.refs.text.innerHTML = this.refs.text.innerHTML.replace('<p class="dummy"></p>', compile(tokens));

				this.refs.text.children.forEach(e => {
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
		});

		this.on('unmount', () => {
			this.decapture(true);
			this.stream.off('_connected_', this.onStreamConnected);
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
				source: this.refs.reactButton,
				post: this.p,
				compact: true
			});
		};
	</script>
</mk-timeline-post>

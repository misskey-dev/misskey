<mk-timeline-post tabindex="-1" title={ title } onkeydown={ onKeyDown }>
	<div class="reply-to" if={ p.reply_to }>
		<mk-timeline-post-sub post={ p.reply_to }></mk-timeline-post-sub>
	</div>
	<div class="repost" if={ isRepost }>
		<p>
			<a class="avatar-anchor" href={ CONFIG.url + '/' + post.user.username } data-user-preview={ post.user_id }>
				<img class="avatar" src={ post.user.avatar_url + '?thumbnail&size=32' } alt="avatar"/>
			</a>
			<i class="fa fa-retweet"></i>
			<a class="name" href={ CONFIG.url + '/' + post.user.username } data-user-preview={ post.user_id }>{ post.user.name }</a>
			がRepost
		</p>
		<mk-time time={ post.created_at }></mk-time>
	</div>
	<article>
		<a class="avatar-anchor" href={ CONFIG.url + '/' + p.user.username }>
			<img class="avatar" src={ p.user.avatar_url + '?thumbnail&size=64' } alt="avatar" data-user-preview={ p.user.id }/>
		</a>
		<div class="main">
			<header>
				<a class="name" href={ CONFIG.url + '/' + p.user.username } data-user-preview={ p.user.id }>{ p.user.name }</a>
				<span class="is-bot" if={ p.user.is_bot }>bot</span>
				<span class="username">@{ p.user.username }</span>
				<div class="info">
					<span class="app" if={ p.app }>via <b>{ p.app.name }</b></span>
					<a class="created-at" href={ url }>
						<mk-time time={ p.created_at }></mk-time>
					</a>
				</div>
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
				<mk-poll if={ p.poll } post={ p }></mk-poll>
				<div class="repost" if={ p.repost }><i class="fa fa-quote-right fa-flip-horizontal"></i>
					<mk-post-preview class="repost" post={ p.repost }></mk-post-preview>
				</div>
			</div>
			<footer>
				<mk-reactions-viewer post={ p }></mk-reactions-viewer>
				<button onclick={ reply } title="返信"><i class="fa fa-reply"></i>
					<p class="count" if={ p.replies_count > 0 }>{ p.replies_count }</p>
				</button>
				<button onclick={ repost } title="Repost"><i class="fa fa-retweet"></i>
					<p class="count" if={ p.repost_count > 0 }>{ p.repost_count }</p>
				</button>
				<button class={ reacted: p.my_reaction != null } onclick={ react } ref="reactButton" title="リアクション"><i class="fa fa-plus"></i>
					<p class="count" if={ p.reactions_count > 0 }>{ p.reactions_count }</p>
				</button>
				<button>
					<i class="fa fa-ellipsis-h"></i>
				</button>
				<button onclick={ toggleDetail } title="詳細">
					<i class="fa fa-caret-down" if={ !isDetailOpened }></i>
					<i class="fa fa-caret-up" if={ isDetailOpened }></i>
				</button>
			</footer>
		</div>
	</article>
	<div class="detail" if={ isDetailOpened }>
		<mk-post-status-graph width="462" height="130" post={ p }></mk-post-status-graph>
	</div>
	<style>
		:scope
			display block
			margin 0
			padding 0
			background #fff

			&:focus
				z-index 1

				&:after
					content ""
					pointer-events none
					position absolute
					top 2px
					right 2px
					bottom 2px
					left 2px
					border 2px solid rgba($theme-color, 0.3)
					border-radius 4px

			> .repost
				color #9dbb00
				background linear-gradient(to bottom, #edfde2 0%, #fff 100%)

				> p
					margin 0
					padding 16px 32px
					line-height 28px

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
					top 16px
					right 32px
					font-size 0.9em
					line-height 28px

				& + article
					padding-top 8px

			> .reply-to
				padding 0 16px
				background rgba(0, 0, 0, 0.0125)

				> mk-post-preview
					background transparent

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
					float left
					margin 0 16px 10px 0
					position -webkit-sticky
					position sticky
					top 74px

					> .avatar
						display block
						width 58px
						height 58px
						margin 0
						border-radius 8px
						vertical-align bottom

				> .main
					float left
					width calc(100% - 74px)

					> header
						display flex
						margin-bottom 4px
						white-space nowrap
						line-height 1.4

						> .name
							display block
							margin 0 .5em 0 0
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
							margin 0 .5em 0 0
							padding 1px 6px
							font-size 12px
							color #aaa
							border solid 1px #ddd
							border-radius 3px

						> .username
							text-align left
							margin 0 .5em 0 0
							color #ccc

						> .info
							margin-left auto
							text-align right
							font-size 0.9em

							> .app
								margin-right 8px
								padding-right 8px
								color #ccc
								border-right solid 1px #eaeaea

							> .created-at
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

							mk-url-preview
								margin-top 8px

							.link
								&:after
									content "\f14c"
									display inline-block
									padding-left 2px
									font-family FontAwesome
									font-size .9em
									font-weight 400
									font-style normal

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
							padding 0 8px
							line-height 32px
							font-size 1em
							color #ddd
							background transparent
							border none
							cursor pointer

							&:hover
								color #666

							> .count
								display inline
								margin 0 0 0 8px
								color #999

							&.reacted
								color $theme-color

							&:last-child
								position absolute
								right 0
								margin 0

			> .detail
				padding-top 4px
				background rgba(0, 0, 0, 0.0125)

	</style>
	<script>
		import compile from '../../common/scripts/text-compiler';
		import dateStringify from '../../common/scripts/date-stringify';

		this.mixin('api');
		this.mixin('user-preview');

		this.isDetailOpened = false;

		this.post = this.opts.post;
		this.isRepost = this.post.repost && this.post.text == null && this.post.media_ids == null && this.post.poll == null;
		this.p = this.isRepost ? this.post.repost : this.post;
		this.p.reactions_count = this.p.reaction_counts ? Object.keys(this.p.reaction_counts).map(key => this.p.reaction_counts[key]).reduce((a, b) => a + b) : 0;
		this.title = dateStringify(this.p.created_at);
		this.url = `/${this.p.user.username}/${this.p.id}`;

		this.on('mount', () => {
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
			const rect = this.refs.reactButton.getBoundingClientRect();
			riot.mount(document.body.appendChild(document.createElement('mk-reaction-picker')), {
				top: rect.top + window.pageYOffset,
				left: rect.left + window.pageXOffset,
				post: this.p
			});
		};

		this.toggleDetail = () => {
			this.update({
				isDetailOpened: !this.isDetailOpened
			});
		};

		this.onKeyDown = e => {
			let shouldBeCancel = true;

			switch (true) {
				case e.which == 38: // [↑]
				case e.which == 74: // [j]
				case e.which == 9 && e.shiftKey: // [Shift] + [Tab]
					focus(this.root, e => e.previousElementSibling);
					break;

				case e.which == 40: // [↓]
				case e.which == 75: // [k]
				case e.which == 9: // [Tab]
					focus(this.root, e => e.nextElementSibling);
					break;

				case e.which == 81: // [q]
				case e.which == 69: // [e]
					this.repost();
					break;

				case e.which == 70: // [f]
				case e.which == 76: // [l]
					this.like();
					break;

				case e.which == 82: // [r]
					this.reply();
					break;

				default:
					shouldBeCancel = false;
			}

			if (shouldBeCancel) e.preventDefault();
		};

		function focus(el, fn) {
			const target = fn(el);
			if (target) {
				if (target.hasAttribute('tabindex')) {
					target.focus();
				} else {
					focus(target, fn);
				}
			}
		}
	</script>
</mk-timeline-post>

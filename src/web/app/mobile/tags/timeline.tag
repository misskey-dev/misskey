<mk-timeline>
	<div class="init" v-if="init">
		%fa:spinner .pulse%%i18n:common.loading%
	</div>
	<div class="empty" v-if="!init && posts.length == 0">
		%fa:R comments%{ opts.empty || '%i18n:mobile.tags.mk-timeline.empty%' }
	</div>
	<virtual each={ post, i in posts }>
		<mk-timeline-post post={ post }/>
		<p class="date" v-if="i != posts.length - 1 && post._date != posts[i + 1]._date">
			<span>%fa:angle-up%{ post._datetext }</span>
			<span>%fa:angle-down%{ posts[i + 1]._datetext }</span>
		</p>
	</virtual>
	<footer v-if="!init">
		<button v-if="canFetchMore" @click="more" disabled={ fetching }>
			<span v-if="!fetching">%i18n:mobile.tags.mk-timeline.load-more%</span>
			<span v-if="fetching">%i18n:common.loading%<mk-ellipsis/></span>
		</button>
	</footer>
	<style lang="stylus" scoped>
		:scope
			display block
			background #fff
			border-radius 8px
			box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

			> .init
				padding 64px 0
				text-align center
				color #999

				> [data-fa]
					margin-right 4px

			> .empty
				margin 0 auto
				padding 32px
				max-width 400px
				text-align center
				color #999

				> [data-fa]
					display block
					margin-bottom 16px
					font-size 3em
					color #ccc

			> .date
				display block
				margin 0
				line-height 32px
				text-align center
				font-size 0.9em
				color #aaa
				background #fdfdfd
				border-bottom solid 1px #eaeaea

				span
					margin 0 16px

				[data-fa]
					margin-right 8px

			> footer
				text-align center
				border-top solid 1px #eaeaea
				border-bottom-left-radius 4px
				border-bottom-right-radius 4px

				> button
					margin 0
					padding 16px
					width 100%
					color $theme-color
					border-radius 0 0 8px 8px

					&:disabled
						opacity 0.7

	</style>
	<script lang="typescript">
		this.posts = [];
		this.init = true;
		this.fetching = false;
		this.canFetchMore = true;

		this.on('mount', () => {
			this.opts.init.then(posts => {
				this.init = false;
				this.setPosts(posts);
			});
		});

		this.on('update', () => {
			this.posts.forEach(post => {
				const date = new Date(post.created_at).getDate();
				const month = new Date(post.created_at).getMonth() + 1;
				post._date = date;
				post._datetext = `${month}月 ${date}日`;
			});
		});

		this.more = () => {
			if (this.init || this.fetching || this.posts.length == 0) return;
			this.update({
				fetching: true
			});
			this.opts.more().then(posts => {
				this.fetching = false;
				this.prependPosts(posts);
			});
		};

		this.setPosts = posts => {
			this.update({
				posts: posts
			});
		};

		this.prependPosts = posts => {
			posts.forEach(post => {
				this.posts.push(post);
				this.update();
			});
		}

		this.addPost = post => {
			this.posts.unshift(post);
			this.update();
		};

		this.tail = () => {
			return this.posts[this.posts.length - 1];
		};
	</script>
</mk-timeline>

<mk-timeline-post class={ repost: isRepost }>
	<div class="reply-to" v-if="p.reply">
		<mk-timeline-post-sub post={ p.reply }/>
	</div>
	<div class="repost" v-if="isRepost">
		<p>
			<a class="avatar-anchor" href={ '/' + post.user.username }>
				<img class="avatar" src={ post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
			</a>
			%fa:retweet%{'%i18n:mobile.tags.mk-timeline-post.reposted-by%'.substr(0, '%i18n:mobile.tags.mk-timeline-post.reposted-by%'.indexOf('{'))}<a class="name" href={ '/' + post.user.username }>{ post.user.name }</a>{'%i18n:mobile.tags.mk-timeline-post.reposted-by%'.substr('%i18n:mobile.tags.mk-timeline-post.reposted-by%'.indexOf('}') + 1)}
		</p>
		<mk-time time={ post.created_at }/>
	</div>
	<article>
		<a class="avatar-anchor" href={ '/' + p.user.username }>
			<img class="avatar" src={ p.user.avatar_url + '?thumbnail&size=96' } alt="avatar"/>
		</a>
		<div class="main">
			<header>
				<a class="name" href={ '/' + p.user.username }>{ p.user.name }</a>
				<span class="is-bot" v-if="p.user.is_bot">bot</span>
				<span class="username">@{ p.user.username }</span>
				<a class="created-at" href={ url }>
					<mk-time time={ p.created_at }/>
				</a>
			</header>
			<div class="body">
				<div class="text" ref="text">
					<p class="channel" v-if="p.channel != null"><a href={ _CH_URL_ + '/' + p.channel.id } target="_blank">{ p.channel.title }</a>:</p>
					<a class="reply" v-if="p.reply">
						%fa:reply%
					</a>
					<p class="dummy"></p>
					<a class="quote" v-if="p.repost != null">RP:</a>
				</div>
				<div class="media" v-if="p.media">
					<mk-images images={ p.media }/>
				</div>
				<mk-poll v-if="p.poll" post={ p } ref="pollViewer"/>
				<span class="app" v-if="p.app">via <b>{ p.app.name }</b></span>
				<div class="repost" v-if="p.repost">%fa:quote-right -flip-h%
					<mk-post-preview class="repost" post={ p.repost }/>
				</div>
			</div>
			<footer>
				<mk-reactions-viewer post={ p } ref="reactionsViewer"/>
				<button @click="reply">
					%fa:reply%<p class="count" v-if="p.replies_count > 0">{ p.replies_count }</p>
				</button>
				<button @click="repost" title="Repost">
					%fa:retweet%<p class="count" v-if="p.repost_count > 0">{ p.repost_count }</p>
				</button>
				<button class={ reacted: p.my_reaction != null } @click="react" ref="reactButton">
					%fa:plus%<p class="count" v-if="p.reactions_count > 0">{ p.reactions_count }</p>
				</button>
				<button class="menu" @click="menu" ref="menuButton">
					%fa:ellipsis-h%
				</button>
			</footer>
		</div>
	</article>
	<style lang="stylus" scoped>
		:scope
			display block
			margin 0
			padding 0
			font-size 12px
			border-bottom solid 1px #eaeaea

			&:first-child
				border-radius 8px 8px 0 0

				> .repost
					border-radius 8px 8px 0 0

			&:last-of-type
				border-bottom none

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

					[data-fa]
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

							mk-url-preview
								margin-top 8px

							> .channel
								margin 0

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

							> [data-fa]:first-child
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

							&.menu
								@media (max-width 350px)
									display none

	</style>
	<script lang="typescript">
		import compile from '../../common/scripts/text-compiler';
		import getPostSummary from '../../../../common/get-post-summary.ts';
		import openPostForm from '../scripts/open-post-form';

		this.mixin('i');
		this.mixin('api');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

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
			if (this.$refs.reactionsViewer) this.$refs.reactionsViewer.update({
				post
			});
			if (this.$refs.pollViewer) this.$refs.pollViewer.init(post);
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
			if (this.SIGNIN) {
				this.connection.send({
					type: 'capture',
					id: this.post.id
				});
				if (withHandler) this.connection.on('post-updated', this.onStreamPostUpdated);
			}
		};

		this.decapture = withHandler => {
			if (this.SIGNIN) {
				this.connection.send({
					type: 'decapture',
					id: this.post.id
				});
				if (withHandler) this.connection.off('post-updated', this.onStreamPostUpdated);
			}
		};

		this.on('mount', () => {
			this.capture(true);

			if (this.SIGNIN) {
				this.connection.on('_connected_', this.onStreamConnected);
			}

			if (this.p.text) {
				const tokens = this.p.ast;

				this.$refs.text.innerHTML = this.$refs.text.innerHTML.replace('<p class="dummy"></p>', compile(tokens));

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
		});

		this.on('unmount', () => {
			this.decapture(true);
			this.connection.off('_connected_', this.onStreamConnected);
			this.stream.dispose(this.connectionId);
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
	</script>
</mk-timeline-post>

<mk-timeline-post-sub>
	<article><a class="avatar-anchor" href={ '/' + post.user.username }><img class="avatar" src={ post.user.avatar_url + '?thumbnail&size=96' } alt="avatar"/></a>
		<div class="main">
			<header><a class="name" href={ '/' + post.user.username }>{ post.user.name }</a><span class="username">@{ post.user.username }</span><a class="created-at" href={ '/' + post.user.username + '/' + post.id }>
					<mk-time time={ post.created_at }/></a></header>
			<div class="body">
				<mk-sub-post-content class="text" post={ post }/>
			</div>
		</div>
	</article>
	<style lang="stylus" scoped>
		:scope
			display block
			margin 0
			padding 0
			font-size 0.9em

			> article
				padding 16px

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
					margin 0 10px 0 0

					@media (min-width 500px)
						margin-right 16px

					> .avatar
						display block
						width 44px
						height 44px
						margin 0
						border-radius 8px
						vertical-align bottom

						@media (min-width 500px)
							width 52px
							height 52px

				> .main
					float left
					width calc(100% - 54px)

					@media (min-width 500px)
						width calc(100% - 68px)

					> header
						display flex
						margin-bottom 2px
						white-space nowrap

						> .name
							display block
							margin 0 0.5em 0 0
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
							margin 0
							color #d1d8da

						> .created-at
							margin-left auto
							color #b2b8bb

					> .body

						> .text
							cursor default
							margin 0
							padding 0
							font-size 1.1em
							color #717171

							pre
								max-height 120px
								font-size 80%

	</style>
	<script lang="typescript">this.post = this.opts.post</script>
</mk-timeline-post-sub>

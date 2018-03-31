<template>
<div class="post" tabindex="-1" :title="title" @keydown="onKeydown">
	<div class="reply-to" v-if="p.reply">
		<x-sub :post="p.reply"/>
	</div>
	<div class="repost" v-if="isRepost">
		<p>
			<router-link class="avatar-anchor" :to="`/@${acct}`" v-user-preview="post.userId">
				<img class="avatar" :src="`${post.user.avatarUrl}?thumbnail&size=32`" alt="avatar"/>
			</router-link>
			%fa:retweet%
			<span>{{ '%i18n:desktop.tags.mk-timeline-post.reposted-by%'.substr(0, '%i18n:desktop.tags.mk-timeline-post.reposted-by%'.indexOf('{')) }}</span>
			<a class="name" :href="`/@${acct}`" v-user-preview="post.userId">{{ post.user.name }}</a>
			<span>{{ '%i18n:desktop.tags.mk-timeline-post.reposted-by%'.substr('%i18n:desktop.tags.mk-timeline-post.reposted-by%'.indexOf('}') + 1) }}</span>
		</p>
		<mk-time :time="post.createdAt"/>
	</div>
	<article>
		<router-link class="avatar-anchor" :to="`/@${acct}`">
			<img class="avatar" :src="`${p.user.avatarUrl}?thumbnail&size=64`" alt="avatar" v-user-preview="p.user.id"/>
		</router-link>
		<div class="main">
			<header>
				<router-link class="name" :to="`/@${acct}`" v-user-preview="p.user.id">{{ acct }}</router-link>
				<span class="is-bot" v-if="p.user.host === null && p.user.account.isBot">bot</span>
				<span class="username">@{{ acct }}</span>
				<div class="info">
					<span class="app" v-if="p.app">via <b>{{ p.app.name }}</b></span>
					<span class="mobile" v-if="p.viaMobile">%fa:mobile-alt%</span>
					<router-link class="created-at" :to="url">
						<mk-time :time="p.createdAt"/>
					</router-link>
				</div>
			</header>
			<div class="body">
				<p class="channel" v-if="p.channel">
					<a :href="`${_CH_URL_}/${p.channel.id}`" target="_blank">{{ p.channel.title }}</a>:
				</p>
				<div class="text">
					<a class="reply" v-if="p.reply">%fa:reply%</a>
					<mk-post-html v-if="p.ast" :ast="p.ast" :i="os.i" :class="$style.text"/>
					<a class="rp" v-if="p.repost">RP:</a>
				</div>
				<div class="media" v-if="p.media.length > 0">
					<mk-media-list :media-list="p.media"/>
				</div>
				<mk-poll v-if="p.poll" :post="p" ref="pollViewer"/>
				<div class="tags" v-if="p.tags && p.tags.length > 0">
					<router-link v-for="tag in p.tags" :key="tag" :to="`/search?q=#${tag}`">{{ tag }}</router-link>
				</div>
				<a class="location" v-if="p.geo" :href="`http://maps.google.com/maps?q=${p.geo.coordinates[1]},${p.geo.coordinates[0]}`" target="_blank">%fa:map-marker-alt% 位置情報</a>
				<div class="map" v-if="p.geo" ref="map"></div>
				<div class="repost" v-if="p.repost">
					<mk-post-preview :post="p.repost"/>
				</div>
				<mk-url-preview v-for="url in urls" :url="url" :key="url"/>
			</div>
			<footer>
				<mk-reactions-viewer :post="p" ref="reactionsViewer"/>
				<button @click="reply" title="%i18n:desktop.tags.mk-timeline-post.reply%">
					%fa:reply%<p class="count" v-if="p.repliesCount > 0">{{ p.repliesCount }}</p>
				</button>
				<button @click="repost" title="%i18n:desktop.tags.mk-timeline-post.repost%">
					%fa:retweet%<p class="count" v-if="p.repostCount > 0">{{ p.repostCount }}</p>
				</button>
				<button :class="{ reacted: p.myReaction != null }" @click="react" ref="reactButton" title="%i18n:desktop.tags.mk-timeline-post.add-reaction%">
					%fa:plus%<p class="count" v-if="p.reactions_count > 0">{{ p.reactions_count }}</p>
				</button>
				<button @click="menu" ref="menuButton">
					%fa:ellipsis-h%
				</button>
				<button title="%i18n:desktop.tags.mk-timeline-post.detail">
					<template v-if="!isDetailOpened">%fa:caret-down%</template>
					<template v-if="isDetailOpened">%fa:caret-up%</template>
				</button>
			</footer>
		</div>
	</article>
	<div class="detail" v-if="isDetailOpened">
		<mk-post-status-graph width="462" height="130" :post="p"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import dateStringify from '../../../common/scripts/date-stringify';
import getAcct from '../../../../../common/user/get-acct';
import MkPostFormWindow from './post-form-window.vue';
import MkRepostFormWindow from './repost-form-window.vue';
import MkPostMenu from '../../../common/views/components/post-menu.vue';
import MkReactionPicker from '../../../common/views/components/reaction-picker.vue';
import XSub from './posts.post.sub.vue';

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

export default Vue.extend({
	components: {
		XSub
	},
	props: ['post'],
	data() {
		return {
			isDetailOpened: false,
			connection: null,
			connectionId: null
		};
	},
	computed: {
		acct() {
			return getAcct(this.p.user);
		},
		isRepost(): boolean {
			return (this.post.repost &&
				this.post.text == null &&
				this.post.mediaIds == null &&
				this.post.poll == null);
		},
		p(): any {
			return this.isRepost ? this.post.repost : this.post;
		},
		reactionsCount(): number {
			return this.p.reactionCounts
				? Object.keys(this.p.reactionCounts)
					.map(key => this.p.reactionCounts[key])
					.reduce((a, b) => a + b)
				: 0;
		},
		title(): string {
			return dateStringify(this.p.createdAt);
		},
		url(): string {
			return `/@${this.acct}/${this.p.id}`;
		},
		urls(): string[] {
			if (this.p.ast) {
				return this.p.ast
					.filter(t => (t.type == 'url' || t.type == 'link') && !t.silent)
					.map(t => t.url);
			} else {
				return null;
			}
		}
	},
	created() {
		if ((this as any).os.isSignedIn) {
			this.connection = (this as any).os.stream.getConnection();
			this.connectionId = (this as any).os.stream.use();
		}
	},
	mounted() {
		this.capture(true);

		if ((this as any).os.isSignedIn) {
			this.connection.on('_connected_', this.onStreamConnected);
		}

		// Draw map
		if (this.p.geo) {
			const shouldShowMap = (this as any).os.isSignedIn ? (this as any).os.i.account.clientSettings.showMaps : true;
			if (shouldShowMap) {
				(this as any).os.getGoogleMaps().then(maps => {
					const uluru = new maps.LatLng(this.p.geo.coordinates[1], this.p.geo.coordinates[0]);
					const map = new maps.Map(this.$refs.map, {
						center: uluru,
						zoom: 15
					});
					new maps.Marker({
						position: uluru,
						map: map
					});
				});
			}
		}
	},
	beforeDestroy() {
		this.decapture(true);

		if ((this as any).os.isSignedIn) {
			this.connection.off('_connected_', this.onStreamConnected);
			(this as any).os.stream.dispose(this.connectionId);
		}
	},
	methods: {
		capture(withHandler = false) {
			if ((this as any).os.isSignedIn) {
				this.connection.send({
					type: 'capture',
					id: this.p.id
				});
				if (withHandler) this.connection.on('post-updated', this.onStreamPostUpdated);
			}
		},
		decapture(withHandler = false) {
			if ((this as any).os.isSignedIn) {
				this.connection.send({
					type: 'decapture',
					id: this.p.id
				});
				if (withHandler) this.connection.off('post-updated', this.onStreamPostUpdated);
			}
		},
		onStreamConnected() {
			this.capture();
		},
		onStreamPostUpdated(data) {
			const post = data.post;
			if (post.id == this.post.id) {
				this.$emit('update:post', post);
			} else if (post.id == this.post.repostId) {
				this.post.repost = post;
			}
		},
		reply() {
			(this as any).os.new(MkPostFormWindow, {
				reply: this.p
			});
		},
		repost() {
			(this as any).os.new(MkRepostFormWindow, {
				post: this.p
			});
		},
		react() {
			(this as any).os.new(MkReactionPicker, {
				source: this.$refs.reactButton,
				post: this.p
			});
		},
		menu() {
			(this as any).os.new(MkPostMenu, {
				source: this.$refs.menuButton,
				post: this.p
			});
		},
		onKeydown(e) {
			let shouldBeCancel = true;

			switch (true) {
				case e.which == 38: // [↑]
				case e.which == 74: // [j]
				case e.which == 9 && e.shiftKey: // [Shift] + [Tab]
					focus(this.$el, e => e.previousElementSibling);
					break;

				case e.which == 40: // [↓]
				case e.which == 75: // [k]
				case e.which == 9: // [Tab]
					focus(this.$el, e => e.nextElementSibling);
					break;

				case e.which == 81: // [q]
				case e.which == 69: // [e]
					this.repost();
					break;

				case e.which == 70: // [f]
				case e.which == 76: // [l]
					//this.like();
					break;

				case e.which == 82: // [r]
					this.reply();
					break;

				default:
					shouldBeCancel = false;
			}

			if (shouldBeCancel) e.preventDefault();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.post
	margin 0
	padding 0
	background #fff
	border-bottom solid 1px #eaeaea

	&:first-child
		border-top-left-radius 6px
		border-top-right-radius 6px

		> .repost
			border-top-left-radius 6px
			border-top-right-radius 6px

	&:last-of-type
		border-bottom none

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

			[data-fa]
				margin-right 4px

			.name
				font-weight bold

		> .mk-time
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

		> .mk-post-preview
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
			//position -webkit-sticky
			//position sticky
			//top 74px

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
				align-items center
				margin-bottom 4px
				white-space nowrap

				> .name
					display block
					margin 0 .5em 0 0
					padding 0
					overflow hidden
					color #627079
					font-size 1em
					font-weight bold
					text-decoration none
					text-overflow ellipsis

					&:hover
						text-decoration underline

				> .is-bot
					margin 0 .5em 0 0
					padding 1px 6px
					font-size 12px
					color #aaa
					border solid 1px #ddd
					border-radius 3px

				> .username
					margin 0 .5em 0 0
					color #ccc

				> .info
					margin-left auto
					font-size 0.9em

					> .mobile
						margin-right 8px
						color #ccc

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

					>>> .quote
						margin 8px
						padding 6px 12px
						color #aaa
						border-left solid 3px #eee

					> .reply
						margin-right 8px
						color #717171

					> .rp
						margin-left 4px
						font-style oblique
						color #a0bf46

				> .location
					margin 4px 0
					font-size 12px
					color #ccc

				> .map
					width 100%
					height 300px

					&:empty
						display none

				> .tags
					margin 4px 0 0 0

					> *
						display inline-block
						margin 0 8px 0 0
						padding 2px 8px 2px 16px
						font-size 90%
						color #8d969e
						background #edf0f3
						border-radius 4px

						&:before
							content ""
							display block
							position absolute
							top 0
							bottom 0
							left 4px
							width 8px
							height 8px
							margin auto 0
							background #fff
							border-radius 100%

						&:hover
							text-decoration none
							background #e2e7ec

				.mk-url-preview
					margin-top 8px

				> .channel
					margin 0

				> .mk-poll
					font-size 80%

				> .repost
					margin 8px 0

					> .mk-post-preview
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

<style lang="stylus" module>
.text

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
</style>

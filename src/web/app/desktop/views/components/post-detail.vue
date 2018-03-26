<template>
<div class="mk-post-detail" :title="title">
	<button
		class="read-more"
		v-if="p.reply && p.reply.reply_id && context == null"
		title="会話をもっと読み込む"
		@click="fetchContext"
		:disabled="contextFetching"
	>
		<template v-if="!contextFetching">%fa:ellipsis-v%</template>
		<template v-if="contextFetching">%fa:spinner .pulse%</template>
	</button>
	<div class="context">
		<x-sub v-for="post in context" :key="post.id" :post="post"/>
	</div>
	<div class="reply-to" v-if="p.reply">
		<x-sub :post="p.reply"/>
	</div>
	<div class="repost" v-if="isRepost">
		<p>
			<router-link class="avatar-anchor" :to="`/${post.user.username}`" v-user-preview="post.user_id">
				<img class="avatar" :src="`${post.user.avatar_url}?thumbnail&size=32`" alt="avatar"/>
			</router-link>
			%fa:retweet%
			<router-link class="name" :href="`/${post.user.username}`">{{ post.user.name }}</router-link>
			がRepost
		</p>
	</div>
	<article>
		<router-link class="avatar-anchor" :to="`/${p.user.username}`">
			<img class="avatar" :src="`${p.user.avatar_url}?thumbnail&size=64`" alt="avatar" v-user-preview="p.user.id"/>
		</router-link>
		<header>
			<router-link class="name" :to="`/${p.user.username}`" v-user-preview="p.user.id">{{ p.user.name }}</router-link>
			<span class="username">@{{ p.user.username }}</span>
			<router-link class="time" :to="`/${p.user.username}/${p.id}`">
				<mk-time :time="p.created_at"/>
			</router-link>
		</header>
		<div class="body">
			<mk-post-html :class="$style.text" v-if="p.ast" :ast="p.ast" :i="os.i"/>
			<div class="media" v-if="p.media">
				<mk-media-list :mediaList="p.media"/>
			</div>
			<mk-poll v-if="p.poll" :post="p"/>
			<mk-url-preview v-for="url in urls" :url="url" :key="url"/>
			<div class="tags" v-if="p.tags && p.tags.length > 0">
				<router-link v-for="tag in p.tags" :key="tag" :to="`/search?q=#${tag}`">{{ tag }}</router-link>
			</div>
			<a class="location" v-if="p.geo" :href="`http://maps.google.com/maps?q=${p.geo.latitude},${p.geo.longitude}`" target="_blank">%fa:map-marker-alt% 位置情報</a>
			<div class="map" v-if="p.geo" ref="map"></div>
			<div class="repost" v-if="p.repost">
				<mk-post-preview :post="p.repost"/>
			</div>
		</div>
		<footer>
			<mk-reactions-viewer :post="p"/>
			<button @click="reply" title="返信">
				%fa:reply%<p class="count" v-if="p.replies_count > 0">{{ p.replies_count }}</p>
			</button>
			<button @click="repost" title="Repost">
				%fa:retweet%<p class="count" v-if="p.repost_count > 0">{{ p.repost_count }}</p>
			</button>
			<button :class="{ reacted: p.my_reaction != null }" @click="react" ref="reactButton" title="リアクション">
				%fa:plus%<p class="count" v-if="p.reactions_count > 0">{{ p.reactions_count }}</p>
			</button>
			<button @click="menu" ref="menuButton">
				%fa:ellipsis-h%
			</button>
		</footer>
	</article>
	<div class="replies" v-if="!compact">
		<x-sub v-for="post in replies" :key="post.id" :post="post"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import dateStringify from '../../../common/scripts/date-stringify';

import MkPostFormWindow from './post-form-window.vue';
import MkRepostFormWindow from './repost-form-window.vue';
import MkPostMenu from '../../../common/views/components/post-menu.vue';
import MkReactionPicker from '../../../common/views/components/reaction-picker.vue';
import XSub from './post-detail.sub.vue';

export default Vue.extend({
	components: {
		XSub
	},
	props: {
		post: {
			type: Object,
			required: true
		},
		compact: {
			default: false
		}
	},
	data() {
		return {
			context: [],
			contextFetching: false,
			replies: [],
		};
	},
	computed: {
		isRepost(): boolean {
			return (this.post.repost &&
				this.post.text == null &&
				this.post.media_ids == null &&
				this.post.poll == null);
		},
		p(): any {
			return this.isRepost ? this.post.repost : this.post;
		},
		reactionsCount(): number {
			return this.p.reaction_counts
				? Object.keys(this.p.reaction_counts)
					.map(key => this.p.reaction_counts[key])
					.reduce((a, b) => a + b)
				: 0;
		},
		title(): string {
			return dateStringify(this.p.created_at);
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
	mounted() {
		// Get replies
		if (!this.compact) {
			(this as any).api('posts/replies', {
				post_id: this.p.id,
				limit: 8
			}).then(replies => {
				this.replies = replies;
			});
		}

		// Draw map
		if (this.p.geo) {
			const shouldShowMap = (this as any).os.isSignedIn ? (this as any).os.i.account.client_settings.showMaps : true;
			if (shouldShowMap) {
				(this as any).os.getGoogleMaps().then(maps => {
					const uluru = new maps.LatLng(this.p.geo.latitude, this.p.geo.longitude);
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
	methods: {
		fetchContext() {
			this.contextFetching = true;

			// Fetch context
			(this as any).api('posts/context', {
				post_id: this.p.reply_id
			}).then(context => {
				this.contextFetching = false;
				this.context = context.reverse();
			});
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
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-post-detail
	margin 0
	padding 0
	overflow hidden
	text-align left
	background #fff
	border solid 1px rgba(0, 0, 0, 0.1)
	border-radius 8px

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

			> .repost
				margin 8px 0

				> .mk-post-preview
					padding 16px
					border dashed 1px #c0dac6
					border-radius 8px

			> .location
				margin 4px 0
				font-size 12px
				color #ccc

			> .map
				width 100%
				height 300px

				&:empty
					display none

			> .mk-url-preview
				margin-top 8px

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

<style lang="stylus" module>
.text
	cursor default
	display block
	margin 0
	padding 0
	overflow-wrap break-word
	font-size 1.5em
	color #717171
</style>

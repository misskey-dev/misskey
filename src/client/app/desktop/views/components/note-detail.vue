<template>
<div class="mk-note-detail" :title="title">
	<button
		class="read-more"
		v-if="p.reply && p.reply.replyId && context.length == 0"
		title="%i18n:@more%"
		@click="fetchContext"
		:disabled="contextFetching"
	>
		<template v-if="!contextFetching">%fa:ellipsis-v%</template>
		<template v-if="contextFetching">%fa:spinner .pulse%</template>
	</button>
	<div class="context">
		<x-sub v-for="note in context" :key="note.id" :note="note"/>
	</div>
	<div class="reply-to" v-if="p.reply">
		<x-sub :note="p.reply"/>
	</div>
	<div class="renote" v-if="isRenote">
		<p>
			<mk-avatar class="avatar" :user="note.user"/>
			%fa:retweet%
			<router-link class="name" :href="note.user | userPage">{{ note.user | userName }}</router-link>
			<span>{{ '%i18n:@reposted-by%'.substr(0, '%i18n:@reposted-by%'.indexOf('{')) }}</span>
			<a class="name" :href="note.user | userPage" v-user-preview="note.userId">{{ note.user | userName }}</a>
			<span>{{ '%i18n:@reposted-by%'.substr('%i18n:@reposted-by%'.indexOf('}') + 1) }}</span>
			<mk-time :time="note.createdAt"/>
		</p>
	</div>
	<article>
		<mk-avatar class="avatar" :user="p.user"/>
		<header>
			<router-link class="name" :to="p.user | userPage" v-user-preview="p.user.id">{{ p.user | userName }}</router-link>
			<span class="username"><mk-acct :user="p.user"/></span>
			<router-link class="time" :to="p | notePage">
				<mk-time :time="p.createdAt"/>
			</router-link>
		</header>
		<div class="body">
			<div class="text">
				<span v-if="p.isHidden" style="opacity: 0.5">%i18n:@private%</span>
				<mk-note-html v-if="p.text" :text="p.text" :i="os.i"/>
			</div>
			<div class="media" v-if="p.media.length > 0">
				<mk-media-list :media-list="p.media" :raw="true"/>
			</div>
			<mk-poll v-if="p.poll" :note="p"/>
			<mk-url-preview v-for="url in urls" :url="url" :key="url"/>
			<div class="tags" v-if="p.tags && p.tags.length > 0">
				<router-link v-for="tag in p.tags" :key="tag" :to="`/search?q=#${tag}`">{{ tag }}</router-link>
			</div>
			<a class="location" v-if="p.geo" :href="`http://maps.google.com/maps?q=${p.geo.coordinates[1]},${p.geo.coordinates[0]}`" target="_blank">%fa:map-marker-alt% %i18n:@location%</a>
			<div class="map" v-if="p.geo" ref="map"></div>
			<div class="renote" v-if="p.renote">
				<mk-note-preview :note="p.renote"/>
			</div>
		</div>
		<footer>
			<mk-reactions-viewer :note="p"/>
			<button @click="reply" title="">
				<template v-if="p.reply">%fa:reply-all%</template>
				<template v-else>%fa:reply%</template>
				<p class="count" v-if="p.repliesCount > 0">{{ p.repliesCount }}</p>
			</button>
			<button @click="renote" title="%i18n:@renote%">
				%fa:retweet%<p class="count" v-if="p.renoteCount > 0">{{ p.renoteCount }}</p>
			</button>
			<button :class="{ reacted: p.myReaction != null }" @click="react" ref="reactButton" title="%i18n:@add-reaction%">
				%fa:plus%<p class="count" v-if="p.reactions_count > 0">{{ p.reactions_count }}</p>
			</button>
			<button @click="menu" ref="menuButton">
				%fa:ellipsis-h%
			</button>
		</footer>
	</article>
	<div class="replies" v-if="!compact">
		<x-sub v-for="note in replies" :key="note.id" :note="note"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import dateStringify from '../../../common/scripts/date-stringify';
import parse from '../../../../../text/parse';

import MkPostFormWindow from './post-form-window.vue';
import MkRenoteFormWindow from './renote-form-window.vue';
import MkNoteMenu from '../../../common/views/components/note-menu.vue';
import MkReactionPicker from '../../../common/views/components/reaction-picker.vue';
import XSub from './note-detail.sub.vue';

export default Vue.extend({
	components: {
		XSub
	},

	props: {
		note: {
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
			replies: []
		};
	},

	computed: {
		isRenote(): boolean {
			return (this.note.renote &&
				this.note.text == null &&
				this.note.mediaIds.length == 0 &&
				this.note.poll == null);
		},
		p(): any {
			return this.isRenote ? this.note.renote : this.note;
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
		urls(): string[] {
			if (this.p.text) {
				const ast = parse(this.p.text);
				return ast
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
			(this as any).api('notes/replies', {
				noteId: this.p.id,
				limit: 8
			}).then(replies => {
				this.replies = replies;
			});
		}

		// Draw map
		if (this.p.geo) {
			const shouldShowMap = (this as any).os.isSignedIn ? (this as any).clientSettings.showMaps : true;
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

	methods: {
		fetchContext() {
			this.contextFetching = true;

			// Fetch context
			(this as any).api('notes/context', {
				noteId: this.p.replyId
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
		renote() {
			(this as any).os.new(MkRenoteFormWindow, {
				note: this.p
			});
		},
		react() {
			(this as any).os.new(MkReactionPicker, {
				source: this.$refs.reactButton,
				note: this.p
			});
		},
		menu() {
			(this as any).os.new(MkNoteMenu, {
				source: this.$refs.menuButton,
				note: this.p
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	margin 0 auto
	padding 0
	overflow hidden
	text-align left
	background isDark ? #282C37 : #fff
	border solid 1px rgba(#000, 0.1)
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
		background isDark ? #21242d : #fafafa
		outline none
		border none
		border-bottom solid 1px isDark ? #1c2023 : #eef0f2
		border-radius 6px 6px 0 0

		&:hover
			background isDark ? #2e3440 : #f6f6f6

		&:active
			background isDark ? #21242b : #f0f0f0

		&:disabled
			color isDark ? #21242b : #ccc

	> .context
		> *
			border-bottom 1px solid isDark ? #1c2023 : #eef0f2

	> .renote
		color #9dbb00
		background isDark ? linear-gradient(to bottom, #314027 0%, #282c37 100%) : linear-gradient(to bottom, #edfde2 0%, #fff 100%)

		> p
			margin 0
			padding 16px 32px

			.avatar
				display inline-block
				width 28px
				height 28px
				margin 0 8px 0 0
				border-radius 6px

			[data-fa]
				margin-right 4px

			.name
				font-weight bold

		& + article
			padding-top 8px

	> .reply-to
		border-bottom 1px solid isDark ? #1c2023 : #eef0f2

	> article
		padding 28px 32px 18px 32px

		&:after
			content ""
			display block
			clear both

		&:hover
			> footer > button
				color isDark ? #707b97 : #888

		> .avatar
			width 60px
			height 60px
			border-radius 8px

		> header
			position absolute
			top 28px
			left 108px
			width calc(100% - 108px)

			> .name
				display inline-block
				margin 0
				line-height 24px
				color isDark ? #fff : #627079
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
				color isDark ? #606984 : #ccc

			> .time
				position absolute
				top 0
				right 32px
				font-size 1em
				color isDark ? #606984 : #c0c0c0

		> .body
			padding 8px 0

			> .text
				cursor default
				display block
				margin 0
				padding 0
				overflow-wrap break-word
				font-size 1.5em
				color isDark ? #fff : #717171

			> .renote
				margin 8px 0

				> .mk-note-preview
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
				color isDark ? #606984 : #ccc
				cursor pointer

				&:hover
					color isDark ? #9198af : #666

				> .count
					display inline
					margin 0 0 0 8px
					color #999

				&.reacted
					color $theme-color

	> .replies
		> *
			border-top 1px solid isDark ? #1c2023 : #eef0f2

.mk-note-detail[data-darkmode]
	root(true)

.mk-note-detail:not([data-darkmode])
	root(false)

</style>

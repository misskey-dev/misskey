<template>
<div class="note" tabindex="-1" :title="title" @keydown="onKeydown">
	<div class="reply-to" v-if="p.reply && (!$store.getters.isSignedIn || $store.state.settings.showReplyTarget)">
		<x-sub :note="p.reply"/>
	</div>
	<div class="renote" v-if="isRenote">
		<mk-avatar class="avatar" :user="note.user"/>
		%fa:retweet%
		<span>{{ '%i18n:@reposted-by%'.substr(0, '%i18n:@reposted-by%'.indexOf('{')) }}</span>
		<a class="name" :href="note.user | userPage" v-user-preview="note.userId">{{ note.user | userName }}</a>
		<span>{{ '%i18n:@reposted-by%'.substr('%i18n:@reposted-by%'.indexOf('}') + 1) }}</span>
		<mk-time :time="note.createdAt"/>
	</div>
	<article>
		<mk-avatar class="avatar" :user="p.user"/>
		<div class="main">
			<header>
				<router-link class="name" :to="p.user | userPage" v-user-preview="p.user.id">{{ p.user | userName }}</router-link>
				<span class="is-admin" v-if="p.user.isAdmin">admin</span>
				<span class="is-bot" v-if="p.user.isBot">bot</span>
				<span class="is-cat" v-if="p.user.isCat">cat</span>
				<span class="username"><mk-acct :user="p.user"/></span>
				<div class="info">
					<span class="app" v-if="p.app">via <b>{{ p.app.name }}</b></span>
					<span class="mobile" v-if="p.viaMobile">%fa:mobile-alt%</span>
					<router-link class="created-at" :to="p | notePage">
						<mk-time :time="p.createdAt"/>
					</router-link>
					<span class="visibility" v-if="p.visibility != 'public'">
						<template v-if="p.visibility == 'home'">%fa:home%</template>
						<template v-if="p.visibility == 'followers'">%fa:unlock%</template>
						<template v-if="p.visibility == 'specified'">%fa:envelope%</template>
						<template v-if="p.visibility == 'private'">%fa:lock%</template>
					</span>
				</div>
			</header>
			<div class="body">
				<p v-if="p.cw != null" class="cw">
					<span class="text" v-if="p.cw != ''">{{ p.cw }}</span>
					<span class="toggle" @click="showContent = !showContent">{{ showContent ? '隠す' : 'もっと見る' }}</span>
				</p>
				<div class="content" v-show="p.cw == null || showContent">
					<div class="text">
						<span v-if="p.isHidden" style="opacity: 0.5">%i18n:@private%</span>
						<span v-if="p.deletedAt" style="opacity: 0.5">%i18n:@deleted%</span>
						<a class="reply" v-if="p.reply">%fa:reply%</a>
						<mk-note-html v-if="p.text && !canHideText(p)" :text="p.text" :i="$store.state.i" :class="$style.text"/>
						<a class="rp" v-if="p.renote">RP:</a>
					</div>
					<div class="media" v-if="p.media.length > 0">
						<mk-media-list :media-list="p.media"/>
					</div>
					<mk-poll v-if="p.poll" :note="p" ref="pollViewer"/>
					<div class="tags" v-if="p.tags && p.tags.length > 0">
						<router-link v-for="tag in p.tags" :key="tag" :to="`/search?q=#${tag}`">{{ tag }}</router-link>
					</div>
					<a class="location" v-if="p.geo" :href="`http://maps.google.com/maps?q=${p.geo.coordinates[1]},${p.geo.coordinates[0]}`" target="_blank">%fa:map-marker-alt% 位置情報</a>
					<div class="map" v-if="p.geo" ref="map"></div>
					<div class="renote" v-if="p.renote">
						<mk-note-preview :note="p.renote"/>
					</div>
					<mk-url-preview v-for="url in urls" :url="url" :key="url"/>
				</div>
			</div>
			<footer>
				<mk-reactions-viewer :note="p" ref="reactionsViewer"/>
				<button @click="reply" title="%i18n:@reply%">
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
				<button title="%i18n:@detail">
					<template v-if="!isDetailOpened">%fa:caret-down%</template>
					<template v-if="isDetailOpened">%fa:caret-up%</template>
				</button>
			</footer>
		</div>
	</article>
	<div class="detail" v-if="isDetailOpened">
		<mk-note-status-graph width="462" height="130" :note="p"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import dateStringify from '../../../common/scripts/date-stringify';
import canHideText from '../../../common/scripts/can-hide-text';
import parse from '../../../../../text/parse';

import MkPostFormWindow from './post-form-window.vue';
import MkRenoteFormWindow from './renote-form-window.vue';
import MkNoteMenu from '../../../common/views/components/note-menu.vue';
import MkReactionPicker from '../../../common/views/components/reaction-picker.vue';
import XSub from './notes.note.sub.vue';

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

	props: ['note'],

	data() {
		return {
			showContent: false,
			isDetailOpened: false,
			connection: null,
			connectionId: null
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

	created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = (this as any).os.stream.getConnection();
			this.connectionId = (this as any).os.stream.use();
		}
	},

	mounted() {
		this.capture(true);

		if (this.$store.getters.isSignedIn) {
			this.connection.on('_connected_', this.onStreamConnected);
		}

		// Draw map
		if (this.p.geo) {
			const shouldShowMap = this.$store.getters.isSignedIn ? this.$store.state.settings.showMaps : true;
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

		if (this.$store.getters.isSignedIn) {
			this.connection.off('_connected_', this.onStreamConnected);
			(this as any).os.stream.dispose(this.connectionId);
		}
	},

	methods: {
		canHideText,

		capture(withHandler = false) {
			if (this.$store.getters.isSignedIn) {
				this.connection.send({
					type: 'capture',
					id: this.p.id
				});
				if (withHandler) this.connection.on('note-updated', this.onStreamNoteUpdated);
			}
		},

		decapture(withHandler = false) {
			if (this.$store.getters.isSignedIn) {
				this.connection.send({
					type: 'decapture',
					id: this.p.id
				});
				if (withHandler) this.connection.off('note-updated', this.onStreamNoteUpdated);
			}
		},

		onStreamConnected() {
			this.capture();
		},

		onStreamNoteUpdated(data) {
			const note = data.note;
			if (note.id == this.note.id) {
				this.$emit('update:note', note);
			} else if (note.id == this.note.renoteId) {
				this.note.renote = note;
			}
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
					this.renote();
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

root(isDark)
	margin 0
	padding 0
	background isDark ? #282C37 : #fff
	border-bottom solid 1px isDark ? #1c2023 : #eaeaea

	&[data-round]
		&:first-child
			border-top-left-radius 6px
			border-top-right-radius 6px

			> .renote
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

	> .renote
		display flex
		align-items center
		padding 16px 32px
		line-height 28px
		white-space pre
		color #9dbb00
		background isDark ? linear-gradient(to bottom, #314027 0%, #282c37 100%) : linear-gradient(to bottom, #edfde2 0%, #fff 100%)

		.avatar
			display inline-block
			width 28px
			height 28px
			margin 0 8px 0 0
			border-radius 6px

		[data-fa]
			margin-right 4px

		> span
			flex-shrink 0

			&:last-of-type
				margin-right 8px

		.name
			overflow hidden
			flex-shrink 1
			text-overflow ellipsis
			white-space nowrap
			font-weight bold

		> .mk-time
			display block
			margin-left auto
			flex-shrink 0
			font-size 0.9em

		& + article
			padding-top 8px

	> article
		padding 28px 32px 18px 32px

		&:after
			content ""
			display block
			clear both

		&:hover
			> .main > footer > button
				color isDark ? #707b97 : #888

		> .avatar
			display block
			float left
			margin 0 16px 10px 0
			width 58px
			height 58px
			border-radius 8px
			//position -webkit-sticky
			//position sticky
			//top 74px

		> .main
			float left
			width calc(100% - 74px)

			> header
				display flex
				align-items baseline
				margin-bottom 4px
				white-space nowrap

				> .name
					display block
					margin 0 .5em 0 0
					padding 0
					overflow hidden
					color isDark ? #fff : #627079
					font-size 1em
					font-weight bold
					text-decoration none
					text-overflow ellipsis

					&:hover
						text-decoration underline

				> .is-admin
				> .is-bot
				> .is-cat
					align-self center
					margin 0 .5em 0 0
					padding 1px 6px
					font-size 12px
					color isDark ? #758188 : #aaa
					border solid 1px isDark ? #57616f : #ddd
					border-radius 3px

					&.is-admin
						border-color isDark ? #d42c41 : #f56a7b
						color isDark ? #d42c41 : #f56a7b

				> .username
					margin 0 .5em 0 0
					overflow hidden
					text-overflow ellipsis
					color isDark ? #606984 : #ccc

				> .info
					margin-left auto
					font-size 0.9em

					> *
						color isDark ? #606984 : #c0c0c0

					> .mobile
						margin-right 8px

					> .app
						margin-right 8px
						padding-right 8px
						border-right solid 1px #eaeaea

					> .visibility
						margin-left 8px

			> .body

				> .cw
					cursor default
					display block
					margin 0
					padding 0
					overflow-wrap break-word
					color isDark ? #fff : #717171

					> .text
						margin-right 8px

					> .toggle
						display inline-block
						padding 4px 8px
						font-size 0.7em
						color isDark ? #393f4f : #fff
						background isDark ? #687390 : #b1b9c1
						border-radius 2px
						cursor pointer
						user-select none

						&:hover
							background isDark ? #707b97 : #bbc4ce

				> .content

					> .text
						cursor default
						display block
						margin 0
						padding 0
						overflow-wrap break-word
						color isDark ? #fff : #717171

						>>> .title
							display block
							margin-bottom 4px
							padding 4px
							font-size 90%
							text-align center
							background isDark ? #2f3944 : #eef1f3
							border-radius 4px

						>>> .code
							margin 8px 0

						>>> .quote
							margin 8px
							padding 6px 12px
							color isDark ? #6f808e : #aaa
							border-left solid 3px isDark ? #637182 : #eee

						> .reply
							margin-right 8px
							color isDark ? #99abbf : #717171

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

					> .mk-poll
						font-size 80%

					> .renote
						margin 8px 0

						> .mk-note-preview
							padding 16px
							border dashed 1px isDark ? #4e945e : #c0dac6
							border-radius 8px

			> footer
				> button
					margin 0 28px 0 0
					padding 0 8px
					line-height 32px
					font-size 1em
					color isDark ? #606984 : #ddd
					background transparent
					border none
					cursor pointer

					&:hover
						color isDark ? #9198af : #666

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
		background rgba(#000, 0.0125)

.note[data-darkmode]
	root(true)

.note:not([data-darkmode])
	root(false)

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

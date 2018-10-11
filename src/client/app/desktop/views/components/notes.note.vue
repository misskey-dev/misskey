<template>
<div class="note" v-show="p.deletedAt == null" tabindex="-1" v-hotkey="keymap" :title="title">
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
			<mk-note-header class="header" :note="p"/>
			<div class="body">
				<p v-if="p.cw != null" class="cw">
					<span class="text" v-if="p.cw != ''">{{ p.cw }}</span>
					<mk-cw-button v-model="showContent"/>
				</p>
				<div class="content" v-show="p.cw == null || showContent">
					<div class="text">
						<span v-if="p.isHidden" style="opacity: 0.5">%i18n:@private%</span>
						<span v-if="p.deletedAt" style="opacity: 0.5">%i18n:@deleted%</span>
						<a class="reply" v-if="p.reply">%fa:reply%</a>
						<misskey-flavored-markdown v-if="p.text" :text="p.text" :i="$store.state.i" :class="$style.text"/>
						<a class="rp" v-if="p.renote">RP:</a>
					</div>
					<div class="files" v-if="p.files.length > 0">
						<mk-media-list :media-list="p.files"/>
					</div>
					<mk-poll v-if="p.poll" :note="p" ref="pollViewer"/>
					<a class="location" v-if="p.geo" :href="`https://maps.google.com/maps?q=${p.geo.coordinates[1]},${p.geo.coordinates[0]}`" target="_blank">%fa:map-marker-alt% 位置情報</a>
					<div class="map" v-if="p.geo" ref="map"></div>
					<div class="renote" v-if="p.renote"><mk-note-preview :note="p.renote"/></div>
					<mk-url-preview v-for="url in urls" :url="url" :key="url"/>
				</div>
			</div>
			<footer v-if="p.deletedAt == null">
				<mk-reactions-viewer :note="p" ref="reactionsViewer"/>
				<button class="replyButton" @click="reply()" title="%i18n:@reply%">
					<template v-if="p.reply">%fa:reply-all%</template>
					<template v-else>%fa:reply%</template>
					<p class="count" v-if="p.repliesCount > 0">{{ p.repliesCount }}</p>
				</button>
				<button class="renoteButton" @click="renote()" title="%i18n:@renote%">
					%fa:retweet%<p class="count" v-if="p.renoteCount > 0">{{ p.renoteCount }}</p>
				</button>
				<button class="reactionButton" :class="{ reacted: p.myReaction != null }" @click="react()" ref="reactButton" title="%i18n:@add-reaction%">
					%fa:plus%<p class="count" v-if="p.reactions_count > 0">{{ p.reactions_count }}</p>
				</button>
				<button @click="menu()" ref="menuButton">
					%fa:ellipsis-h%
				</button>
				<!-- <button title="%i18n:@detail">
					<template v-if="!isDetailOpened">%fa:caret-down%</template>
					<template v-if="isDetailOpened">%fa:caret-up%</template>
				</button> -->
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
import parse from '../../../../../mfm/parse';

import MkPostFormWindow from './post-form-window.vue';
import MkRenoteFormWindow from './renote-form-window.vue';
import MkNoteMenu from '../../../common/views/components/note-menu.vue';
import MkReactionPicker from '../../../common/views/components/reaction-picker.vue';
import XSub from './notes.note.sub.vue';
import { sum } from '../../../../../prelude/array';
import noteSubscriber from '../../../common/scripts/note-subscriber';

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

	mixins: [noteSubscriber('note')],

	props: {
		note: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			showContent: false,
			isDetailOpened: false
		};
	},

	computed: {
		keymap(): any {
			return {
				'r|left': () => this.reply(true),
				'e|a|plus': () => this.react(true),
				'q|right': () => this.renote(true),
				'ctrl+q|ctrl+right': this.renoteDirectly,
				'up|k|shift+tab': this.focusBefore,
				'down|j|tab': this.focusAfter,
				'esc': this.blur,
				'm|o': () => this.menu(true),
				's': this.toggleShowContent,
				'1': () => this.reactDirectly('like'),
				'2': () => this.reactDirectly('love'),
				'3': () => this.reactDirectly('laugh'),
				'4': () => this.reactDirectly('hmm'),
				'5': () => this.reactDirectly('surprise'),
				'6': () => this.reactDirectly('congrats'),
				'7': () => this.reactDirectly('angry'),
				'8': () => this.reactDirectly('confused'),
				'9': () => this.reactDirectly('rip'),
				'0': () => this.reactDirectly('pudding'),
			};
		},

		isRenote(): boolean {
			return (this.note.renote &&
				this.note.text == null &&
				this.note.fileIds.length == 0 &&
				this.note.poll == null);
		},

		p(): any {
			return this.isRenote ? this.note.renote : this.note;
		},

		reactionsCount(): number {
			return this.p.reactionCounts
				? sum(Object.values(this.p.reactionCounts))
				: 0;
		},

		title(): string {
			return new Date(this.p.createdAt).toLocaleString();
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

	methods: {
		reply(viaKeyboard = false) {
			(this as any).os.new(MkPostFormWindow, {
				reply: this.p,
				animation: !viaKeyboard
			}).$once('closed', this.focus);
		},

		renote(viaKeyboard = false) {
			(this as any).os.new(MkRenoteFormWindow, {
				note: this.p,
				animation: !viaKeyboard
			}).$once('closed', this.focus);
		},

		renoteDirectly() {
			(this as any).api('notes/create', {
				renoteId: this.p.id
			});
		},

		react(viaKeyboard = false) {
			this.blur();
			(this as any).os.new(MkReactionPicker, {
				source: this.$refs.reactButton,
				note: this.p,
				showFocus: viaKeyboard,
				animation: !viaKeyboard
			}).$once('closed', this.focus);
		},

		reactDirectly(reaction) {
			(this as any).api('notes/reactions/create', {
				noteId: this.p.id,
				reaction: reaction
			});
		},

		menu(viaKeyboard = false) {
			(this as any).os.new(MkNoteMenu, {
				source: this.$refs.menuButton,
				note: this.p,
				animation: !viaKeyboard
			}).$once('closed', this.focus);
		},

		toggleShowContent() {
			this.showContent = !this.showContent;
		},

		focus() {
			this.$el.focus();
		},

		blur() {
			this.$el.blur();
		},

		focusBefore() {
			focus(this.$el, e => e.previousElementSibling);
		},

		focusAfter() {
			focus(this.$el, e => e.nextElementSibling);
		}
	}
});
</script>

<style lang="stylus" scoped>
.note
	margin 0
	padding 0
	background var(--face)
	border-bottom solid 1px var(--faceDivider)

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
			border 2px solid var(--primaryAlpha03)
			border-radius 4px

	> .renote
		display flex
		align-items center
		padding 16px 32px 8px 32px
		line-height 28px
		white-space pre
		color var(--renoteText)
		background linear-gradient(to bottom, var(--renoteGradient) 0%, var(--face) 100%)

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
		display flex
		padding 28px 32px 18px 32px

		&:hover
			> .main > footer > button
				color var(--noteActionsHighlighted)

		> .avatar
			flex-shrink 0
			display block
			margin 0 16px 10px 0
			width 58px
			height 58px
			border-radius 8px
			//position -webkit-sticky
			//position sticky
			//top 74px

		> .main
			flex 1
			min-width 0

			> .header
				margin-bottom 4px

			> .body

				> .cw
					cursor default
					display block
					margin 0
					padding 0
					overflow-wrap break-word
					color var(--noteText)

					> .text
						margin-right 8px

				> .content

					> .text
						cursor default
						display block
						margin 0
						padding 0
						overflow-wrap break-word
						color var(--noteText)

						>>> .title
							display block
							margin-bottom 4px
							padding 4px
							font-size 90%
							text-align center
							background var(--mfmTitleBg)
							border-radius 4px

						>>> .code
							margin 8px 0

						>>> .quote
							margin 8px
							padding 6px 12px
							color var(--mfmQuote)
							border-left solid 3px var(--mfmQuoteLine)

						> .reply
							margin-right 8px
							color var(--text)

						> .rp
							margin-left 4px
							font-style oblique
							color var(--renoteText)

					> .location
						margin 4px 0
						font-size 12px
						color #ccc

					> .map
						width 100%
						height 300px

						&:empty
							display none

					.mk-url-preview
						margin-top 8px

					> .mk-poll
						font-size 80%

					> .renote
						margin 8px 0

						> *
							padding 16px
							border dashed 1px var(--quoteBorder)
							border-radius 8px

			> footer
				> button
					margin 0 28px 0 0
					padding 0 8px
					line-height 32px
					font-size 1em
					color var(--noteActions)
					background transparent
					border none
					cursor pointer

					&:hover
						color var(--noteActionsHover)

					&.replyButton:hover
						color var(--noteActionsReplyHover)

					&.renoteButton:hover
						color var(--noteActionsRenoteHover)

					&.reactionButton:hover
						color var(--noteActionsReactionHover)

					> .count
						display inline
						margin 0 0 0 8px
						color #999

					&.reacted, &.reacted:hover
						color var(--noteActionsReactionHover)

	> .detail
		padding-top 4px
		background rgba(#000, 0.0125)

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
		color var(--primaryForeground)
		background var(--primary)
		border-radius 4px
</style>

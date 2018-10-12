<template>
<div class="note" v-show="appearNote.deletedAt == null" :tabindex="appearNote.deletedAt == null ? '-1' : null" v-hotkey="keymap" :title="title">
	<div class="reply-to" v-if="appearNote.reply && (!$store.getters.isSignedIn || $store.state.settings.showReplyTarget)">
		<x-sub :note="appearNote.reply"/>
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
		<mk-avatar class="avatar" :user="appearNote.user"/>
		<div class="main">
			<mk-note-header class="header" :note="appearNote"/>
			<div class="body">
				<p v-if="appearNote.cw != null" class="cw">
					<span class="text" v-if="appearNote.cw != ''">{{ appearNote.cw }}</span>
					<mk-cw-button v-model="showContent"/>
				</p>
				<div class="content" v-show="appearNote.cw == null || showContent">
					<div class="text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">%i18n:@private%</span>
						<a class="reply" v-if="appearNote.reply">%fa:reply%</a>
						<misskey-flavored-markdown v-if="appearNote.text" :text="appearNote.text" :i="$store.state.i" :class="$style.text"/>
						<a class="rp" v-if="appearNote.renote">RP:</a>
					</div>
					<div class="files" v-if="appearNote.files.length > 0">
						<mk-media-list :media-list="appearNote.files"/>
					</div>
					<mk-poll v-if="appearNote.poll" :note="appearNote" ref="pollViewer"/>
					<a class="location" v-if="appearNote.geo" :href="`https://maps.google.com/maps?q=${appearNote.geo.coordinates[1]},${appearNote.geo.coordinates[0]}`" target="_blank">%fa:map-marker-alt% 位置情報</a>
					<div class="renote" v-if="appearNote.renote"><mk-note-preview :note="appearNote.renote"/></div>
					<mk-url-preview v-for="url in urls" :url="url" :key="url"/>
				</div>
			</div>
			<footer>
				<mk-reactions-viewer :note="appearNote" ref="reactionsViewer"/>
				<button class="replyButton" @click="reply()" title="%i18n:@reply%">
					<template v-if="appearNote.reply">%fa:reply-all%</template>
					<template v-else>%fa:reply%</template>
					<p class="count" v-if="appearNote.repliesCount > 0">{{ appearNote.repliesCount }}</p>
				</button>
				<button class="renoteButton" @click="renote()" title="%i18n:@renote%">
					%fa:retweet%<p class="count" v-if="appearNote.renoteCount > 0">{{ appearNote.renoteCount }}</p>
				</button>
				<button class="reactionButton" :class="{ reacted: appearNote.myReaction != null }" @click="react()" ref="reactButton" title="%i18n:@add-reaction%">
					%fa:plus%<p class="count" v-if="appearNote.reactions_count > 0">{{ appearNote.reactions_count }}</p>
				</button>
				<button @click="menu()" ref="menuButton">
					%fa:ellipsis-h%
				</button>
			</footer>
		</div>
	</article>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

import MkPostFormWindow from './post-form-window.vue';
import MkRenoteFormWindow from './renote-form-window.vue';
import XSub from './notes.note.sub.vue';
import noteMixin from '../../../common/scripts/note-mixin';
import noteSubscriber from '../../../common/scripts/note-subscriber';

export default Vue.extend({
	components: {
		XSub
	},

	mixins: [
		noteMixin(),
		noteSubscriber('note')
	],

	props: {
		note: {
			type: Object,
			required: true
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

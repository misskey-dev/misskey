<template>
<div
	v-if="!mediaView"
	v-show="appearNote.deletedAt == null"
	:tabindex="appearNote.deletedAt == null ? '-1' : null"
	class="zyjjkidcqjnlegkqebitfviomuqmseqk"
	:class="{ renote: isRenote }"
	v-hotkey="keymap"
	:title="title"
>
	<div class="reply-to" v-if="appearNote.reply && (!$store.getters.isSignedIn || $store.state.settings.showReplyTarget)">
		<x-sub :note="appearNote.reply"/>
	</div>
	<div class="renote" v-if="isRenote">
		<mk-avatar class="avatar" :user="note.user"/>
		%fa:retweet%
		<span>{{ '%i18n:@reposted-by%'.substr(0, '%i18n:@reposted-by%'.indexOf('{')) }}</span>
		<router-link class="name" :to="note.user | userPage">{{ note.user | userName }}</router-link>
		<span>{{ '%i18n:@reposted-by%'.substr('%i18n:@reposted-by%'.indexOf('}') + 1) }}</span>
		<mk-time :time="note.createdAt"/>
	</div>
	<article>
		<mk-avatar class="avatar" :user="appearNote.user"/>
		<div class="main">
			<mk-note-header class="header" :note="appearNote" :mini="true"/>
			<div class="body">
				<p v-if="appearNote.cw != null" class="cw">
					<span class="text" v-if="appearNote.cw != ''">{{ appearNote.cw }}</span>
					<mk-cw-button v-model="showContent"/>
				</p>
				<div class="content" v-show="appearNote.cw == null || showContent">
					<div class="text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">(%i18n:@private%)</span>
						<a class="reply" v-if="appearNote.reply">%fa:reply%</a>
						<misskey-flavored-markdown v-if="appearNote.text" :text="appearNote.text" :i="$store.state.i"/>
						<a class="rp" v-if="appearNote.renote != null">RP:</a>
					</div>
					<div class="files" v-if="appearNote.files.length > 0">
						<mk-media-list :media-list="appearNote.files"/>
					</div>
					<mk-poll v-if="appearNote.poll" :note="appearNote" ref="pollViewer"/>
					<a class="location" v-if="appearNote.geo" :href="`https://maps.google.com/maps?q=${appearNote.geo.coordinates[1]},${appearNote.geo.coordinates[0]}`" target="_blank">%fa:map-marker-alt% %i18n:@location%</a>
					<div class="renote" v-if="appearNote.renote">
						<mk-note-preview :note="appearNote.renote" :mini="true"/>
					</div>
					<mk-url-preview v-for="url in urls" :url="url" :key="url" :detail="false" :mini="true"/>
				</div>
				<span class="app" v-if="appearNote.app">via <b>{{ appearNote.app.name }}</b></span>
			</div>
			<footer>
				<mk-reactions-viewer :note="appearNote" ref="reactionsViewer"/>
				<button @click="reply()">
					<template v-if="appearNote.reply">%fa:reply-all%</template>
					<template v-else>%fa:reply%</template>
				</button>
				<button @click="renote()" title="Renote">%fa:retweet%</button>
				<button :class="{ reacted: appearNote.myReaction != null }" @click="react()" ref="reactButton">%fa:plus%</button>
				<button class="menu" @click="menu()" ref="menuButton">%fa:ellipsis-h%</button>
			</footer>
		</div>
	</article>
</div>
<div v-else class="srwrkujossgfuhrbnvqkybtzxpblgchi">
	<div v-if="note.files.length > 0">
		<mk-media-list :media-list="note.files"/>
	</div>
	<div v-if="note.renote && note.renote.files.length > 0">
		<mk-media-list :media-list="note.renote.files"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkPostFormWindow from '../../components/post-form-window.vue';
import MkRenoteFormWindow from '../../components/renote-form-window.vue';
import XSub from './deck.note.sub.vue';
import noteMixin from '../../../../common/scripts/note-mixin';
import noteSubscriber from '../../../../common/scripts/note-subscriber';

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
		},
		mediaView: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	methods: {
		reply(viaKeyboard = false) {
			(this as any).os.new(MkPostFormWindow, {
				reply: this.appearNote,
				animation: !viaKeyboard
			}).$once('closed', this.focus);
		},

		renote(viaKeyboard = false) {
			(this as any).os.new(MkRenoteFormWindow, {
				note: this.appearNote,
				animation: !viaKeyboard
			}).$once('closed', this.focus);
		},
	}
});
</script>

<style lang="stylus" scoped>
.srwrkujossgfuhrbnvqkybtzxpblgchi
	font-size 13px
	margin 4px 12px

	&:first-child
		margin-top 12px

	&:last-child
		margin-bottom 12px

.zyjjkidcqjnlegkqebitfviomuqmseqk
	font-size 13px
	border-bottom solid 1px var(--faceDivider)

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

	&:last-of-type
		border-bottom none

	&.smart
		> article
			> .main
				> header
					align-items center
					margin-bottom 4px

	> .renote
		display flex
		align-items center
		padding 8px 16px 0 16px
		line-height 28px
		white-space pre
		color var(--renoteText)
		background linear-gradient(to bottom, var(--renoteGradient) 0%, var(--face) 100%)

		.avatar
			flex-shrink 0
			display inline-block
			width 20px
			height 20px
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
		padding 16px 16px 4px

		> .avatar
			flex-shrink 0
			display block
			margin 0 10px 8px 0
			width 42px
			height 42px
			border-radius 6px
			//position -webkit-sticky
			//position sticky
			//top 62px

		> .main
			flex 1
			min-width 0

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
							color var(--noteText)

						> .rp
							margin-left 4px
							font-style oblique
							color var(--renoteText)

						[data-is-me]:after
							content "you"
							padding 0 4px
							margin-left 4px
							font-size 80%
							color var(--primaryForeground)
							background var(--primary)
							border-radius 4px

					.mk-url-preview
						margin-top 8px

					> .files
						> img
							display block
							max-width 100%

					> .location
						margin 4px 0
						font-size 12px
						color #ccc

					> .map
						width 100%
						height 200px

						&:empty
							display none

					> .mk-poll
						font-size 80%

					> .renote
						margin 8px 0

						> *
							padding 16px
							border dashed 1px var(--quoteBorder)
							border-radius 8px

				> .app
					font-size 12px
					color #ccc

			> footer
				> button
					margin 0
					padding 4px 8px 8px 8px
					background transparent
					border none
					box-shadow none
					font-size 1em
					color var(--noteActions)
					cursor pointer

					&:not(:last-child)
						margin-right 28px

					&:hover
						color var(--noteActionsHover)

					> .count
						display inline
						margin 0 0 0 8px
						color #999

					&.reacted
						color var(--primary)

</style>

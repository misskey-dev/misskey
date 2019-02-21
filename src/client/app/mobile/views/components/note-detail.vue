<template>
<div class="mk-note-detail" tabindex="-1">
	<button
		class="more"
		v-if="appearNote.reply && appearNote.reply.replyId && conversation.length == 0"
		@click="fetchConversation"
		:disabled="conversationFetching"
	>
		<template v-if="!conversationFetching"><fa icon="ellipsis-v"/></template>
		<template v-if="conversationFetching"><fa icon="spinner" pulse/></template>
	</button>
	<div class="conversation">
		<x-sub v-for="note in conversation" :key="note.id" :note="note"/>
	</div>
	<div class="reply-to" v-if="appearNote.reply">
		<x-sub :note="appearNote.reply"/>
	</div>
	<mk-renote class="renote" v-if="isRenote" :note="note" mini/>
	<article>
		<header>
			<mk-avatar class="avatar" :user="appearNote.user"/>
			<div>
				<router-link class="name" :to="appearNote.user | userPage"><mk-user-name :user="appearNote.user"/></router-link>
				<span class="username"><mk-acct :user="appearNote.user"/></span>
			</div>
		</header>
		<div class="body">
			<p v-if="appearNote.cw != null" class="cw">
				<mfm v-if="appearNote.cw != ''" class="text" :text="appearNote.cw" :author="appearNote.user" :i="$store.state.i" :custom-emojis="appearNote.emojis" />
				<mk-cw-button v-model="showContent" :note="appearNote"/>
			</p>
			<div class="content" v-show="appearNote.cw == null || showContent">
				<div class="text">
					<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ $t('private') }})</span>
					<span v-if="appearNote.deletedAt" style="opacity: 0.5">({{ $t('deleted') }})</span>
					<mfm v-if="appearNote.text" :text="appearNote.text" :author="appearNote.user" :i="$store.state.i" :custom-emojis="appearNote.emojis"/>
				</div>
				<div class="files" v-if="appearNote.files.length > 0">
					<mk-media-list :media-list="appearNote.files" :raw="true"/>
				</div>
				<mk-poll v-if="appearNote.poll" :note="appearNote"/>
				<mk-url-preview v-for="url in urls" :url="url" :key="url" :detail="true"/>
				<a class="location" v-if="appearNote.geo" :href="`https://maps.google.com/maps?q=${appearNote.geo.coordinates[1]},${appearNote.geo.coordinates[0]}`" target="_blank"><fa icon="map-marker-alt"/> {{ $t('location') }}</a>
				<div class="map" v-if="appearNote.geo" ref="map"></div>
				<div class="renote" v-if="appearNote.renote">
					<mk-note-preview :note="appearNote.renote"/>
				</div>
			</div>
		</div>
		<router-link class="time" :to="appearNote | notePage">
			<mk-time :time="appearNote.createdAt" mode="detail"/>
		</router-link>
		<div class="visibility-info">
			<span class="visibility" v-if="appearNote.visibility != 'public'">
				<fa v-if="appearNote.visibility == 'home'" icon="home"/>
				<fa v-if="appearNote.visibility == 'followers'" icon="unlock"/>
				<fa v-if="appearNote.visibility == 'specified'" icon="envelope"/>
			</span>
			<span class="localOnly" v-if="appearNote.localOnly == true"><fa icon="heart"/></span>
		</div>
		<footer>
			<mk-reactions-viewer :note="appearNote"/>
			<button @click="reply()" :title="$t('title')">
				<template v-if="appearNote.reply"><fa icon="reply-all"/></template>
				<template v-else><fa icon="reply"/></template>
				<p class="count" v-if="appearNote.repliesCount > 0">{{ appearNote.repliesCount }}</p>
			</button>
			<button v-if="['public', 'home'].includes(appearNote.visibility)" @click="renote()" title="Renote">
				<fa icon="retweet"/><p class="count" v-if="appearNote.renoteCount > 0">{{ appearNote.renoteCount }}</p>
			</button>
			<button v-else>
				<fa icon="ban"/>
			</button>
			<button v-if="!isMyNote && appearNote.myReaction == null" class="reactionButton" @click="react()" ref="reactButton">
				<fa icon="plus"/>
			</button>
			<button v-if="!isMyNote && appearNote.myReaction != null" class="reactionButton reacted" @click="undoReact(appearNote)" ref="reactButton">
				<fa icon="minus"/>
			</button>
			<button @click="menu()" ref="menuButton">
				<fa icon="ellipsis-h"/>
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
import i18n from '../../../i18n';
import XSub from './note.sub.vue';
import noteSubscriber from '../../../common/scripts/note-subscriber';
import noteMixin from '../../../common/scripts/note-mixin';

export default Vue.extend({
	i18n: i18n('mobile/views/components/note-detail.vue'),

	components: {
		XSub
	},

	mixins: [noteMixin(), noteSubscriber('note')],

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
			conversation: [],
			conversationFetching: false,
			replies: []
		};
	},

	mounted() {
		this.fetchReplies();
	},

	watch: {
		note() {
			this.fetchReplies();
		}
	},

	methods: {
		fetchReplies() {
			if (this.compact) return;
			this.$root.api('notes/replies', {
				noteId: this.appearNote.id,
				limit: 8
			}).then(replies => {
				this.replies = replies;
			});
		},

		fetchConversation() {
			this.conversationFetching = true;

			// Fetch conversation
			this.$root.api('notes/conversation', {
				noteId: this.appearNote.replyId
			}).then(conversation => {
				this.conversationFetching = false;
				this.conversation = conversation.reverse();
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-note-detail
	overflow hidden
	width 100%
	text-align left
	background var(--face)
	border-radius 8px
	box-shadow 0 4px 16px rgba(#000, 0.1)

	@media (min-width 500px)
		box-shadow 0 8px 32px rgba(#000, 0.1)

	> .fetching
		padding 64px 0

	> .more
		display block
		margin 0
		padding 10px 0
		width 100%
		font-size 1em
		text-align center
		color #999
		cursor pointer
		background var(--subNoteBg)
		outline none
		border none
		border-bottom solid 1px var(--faceDivider)
		border-radius 6px 6px 0 0
		box-shadow none

		&:hover
			box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.05)

		&:active
			box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.1)

	> .conversation
		> *
			border-bottom 1px solid var(--faceDivider)

	> .renote + article
		padding-top 8px

	> .reply-to
		border-bottom 1px solid var(--faceDivider)

	> article
		padding 14px 16px 9px 16px

		@media (min-width 500px)
			padding 28px 32px 18px 32px

		&:after
			content ""
			display block
			clear both

		> header
			display flex
			line-height 1.1em

			> .avatar
				display block
				margin 0 12px 0 0
				width 54px
				height 54px
				border-radius 8px

				@media (min-width 500px)
					width 60px
					height 60px

			> div

				> .name
					display inline-block
					margin .4em 0
					color var(--noteHeaderName)
					font-size 16px
					font-weight bold
					text-align left
					text-decoration none

					&:hover
						text-decoration underline

				> .username
					display block
					text-align left
					margin 0
					color var(--noteHeaderAcct)

		> .body
			padding 8px 0

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
					font-size 16px
					color var(--noteText)

					@media (min-width 500px)
						font-size 24px

				> .renote
					margin 8px 0

					> *
						padding 16px
						border dashed 1px var(--quoteBorder)
						border-radius 8px

				> .location
					margin 4px 0
					font-size 12px
					color #ccc

				> .map
					width 100%
					height 200px

					&:empty
						display none

				> .mk-url-preview
					margin-top 8px

				> .files
					> img
						display block
						max-width 100%

		> .time
			font-size 16px
			color var(--noteHeaderInfo)

		> .visibility-info
			color var(--noteHeaderInfo)

			> .localOnly
				margin-left 4px

		> footer
			font-size 1.2em

			> button
				margin 0
				padding 8px
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
					color var(--text)
					opacity 0.7

				&.reacted
					color var(--primary)

	> .replies
		> *
			border-top 1px solid var(--faceDivider)

</style>

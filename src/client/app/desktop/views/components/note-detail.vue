<template>
<div class="mk-note-detail" :title="title" tabindex="-1" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
	<button
		class="read-more"
		v-if="appearNote.reply && appearNote.reply.replyId && conversation.length == 0"
		:title="$t('title')"
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
	<mk-renote class="renote" v-if="isRenote" :note="note"/>
	<article>
		<mk-avatar class="avatar" :user="appearNote.user"/>
		<header>
			<router-link class="name" :to="appearNote.user | userPage" v-user-preview="appearNote.user.id">
				<mk-user-name :user="appearNote.user"/>
			</router-link>
			<span class="username"><mk-acct :user="appearNote.user"/></span>
			<div class="info">
				<router-link class="time" :to="appearNote | notePage">
					<mk-time :time="appearNote.createdAt"/>
				</router-link>
				<div class="visibility-info">
					<span class="visibility" v-if="appearNote.visibility != 'public'">
						<fa v-if="appearNote.visibility == 'home'" icon="home"/>
						<fa v-if="appearNote.visibility == 'followers'" icon="unlock"/>
						<fa v-if="appearNote.visibility == 'specified'" icon="envelope"/>
					</span>
					<span class="localOnly" v-if="appearNote.localOnly == true"><fa icon="heart"/></span>
				</div>
			</div>
		</header>
		<div class="body">
			<p v-if="appearNote.cw != null" class="cw">
				<mfm v-if="appearNote.cw != ''" class="text" :text="appearNote.cw" :author="appearNote.user" :i="$store.state.i" :custom-emojis="appearNote.emojis" />
				<mk-cw-button v-model="showContent" :note="appearNote"/>
			</p>
			<div class="content" v-show="appearNote.cw == null || showContent">
				<div class="text">
					<span v-if="appearNote.isHidden" style="opacity: 0.5">{{ $t('private') }}</span>
					<span v-if="appearNote.deletedAt" style="opacity: 0.5">{{ $t('deleted') }}</span>
					<mfm v-if="appearNote.text" :text="appearNote.text" :author="appearNote.user" :i="$store.state.i" :custom-emojis="appearNote.emojis" />
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
		<footer>
			<span class="app" v-if="note.app && $store.state.settings.showVia">via <b>{{ note.app.name }}</b></span>
			<mk-reactions-viewer :note="appearNote"/>
			<button class="replyButton" @click="reply()" :title="$t('reply')">
				<template v-if="appearNote.reply"><fa icon="reply-all"/></template>
				<template v-else><fa icon="reply"/></template>
				<p class="count" v-if="appearNote.repliesCount > 0">{{ appearNote.repliesCount }}</p>
			</button>
			<button v-if="['public', 'home'].includes(appearNote.visibility)" class="renoteButton" @click="renote()" :title="$t('renote')">
				<fa icon="retweet"/><p class="count" v-if="appearNote.renoteCount > 0">{{ appearNote.renoteCount }}</p>
			</button>
			<button v-else class="inhibitedButton">
				<fa icon="ban"/>
			</button>
			<button v-if="!isMyNote && appearNote.myReaction == null" class="reactionButton" @click="react()" ref="reactButton" :title="$t('add-reaction')">
				<fa icon="plus"/>
			</button>
			<button v-if="!isMyNote && appearNote.myReaction != null" class="reactionButton reacted" @click="undoReact(appearNote)" ref="reactButton" :title="$t('undo-reaction')">
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
	i18n: i18n('desktop/views/components/note-detail.vue'),

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
		// Get replies
		if (!this.compact) {
			this.$root.api('notes/replies', {
				noteId: this.appearNote.id,
				limit: 8
			}).then(replies => {
				this.replies = replies;
			});
		}
	},

	methods: {
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
	text-align left
	background var(--face)

	&.round
		border-radius 6px

		> .read-more
			border-radius 6px 6px 0 0

	&.shadow
		box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

	> .read-more
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

		&:hover
			box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.05)

		&:active
			box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.1)

		&:disabled
			cursor wait

	> .conversation
		> *
			border-bottom 1px solid var(--faceDivider)

	> .renote + article
		padding-top 8px

	> .reply-to
		border-bottom 1px solid var(--faceDivider)

	> article
		padding 28px 32px 18px 32px

		&:after
			content ""
			display block
			clear both

		&:hover
			> footer > button
				color var(--noteActionsHighlighted)

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
				color var(--noteHeaderName)
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
				color var(--noteHeaderAcct)

			> .info
				position absolute
				top 0
				right 32px
				font-size 1em

				> .time
					color var(--noteHeaderInfo)

				> .visibility-info
					text-align: right
					color var(--noteHeaderInfo)

					> .localOnly
						margin-left 4px

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
					cursor default
					display block
					margin 0
					padding 0
					overflow-wrap break-word
					font-size 1.5em
					color var(--noteText)

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
					height 300px

					&:empty
						display none

				> .mk-url-preview
					margin-top 8px

		> footer
			font-size 1.2em

			> .app
				display block
				font-size 0.8em
				margin-left 0.5em
				color var(--noteHeaderInfo)

			> button
				margin 0 28px 0 0
				padding 8px
				background transparent
				border none
				font-size 1em
				color var(--noteActions)
				cursor pointer

				&:hover
					color var(--noteActionsHover)

				&.replyButton:hover
					color var(--noteActionsReplyHover)

				&.renoteButton:hover
					color var(--noteActionsRenoteHover)

				&.reactionButton:hover
					color var(--noteActionsReactionHover)

				&.inhibitedButton
					cursor not-allowed

				> .count
					display inline
					margin 0 0 0 8px
					color var(--text)
					opacity 0.7

				&.reacted, &.reacted:hover
					color var(--noteActionsReactionHover)

	> .replies
		> *
			border-top 1px solid var(--faceDivider)

</style>

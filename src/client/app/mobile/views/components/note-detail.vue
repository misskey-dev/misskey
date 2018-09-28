<template>
<div class="mk-note-detail">
	<button
		class="more"
		v-if="p.reply && p.reply.replyId && conversation.length == 0"
		@click="fetchConversation"
		:disabled="conversationFetching"
	>
		<template v-if="!conversationFetching">%fa:ellipsis-v%</template>
		<template v-if="conversationFetching">%fa:spinner .pulse%</template>
	</button>
	<div class="conversation">
		<x-sub v-for="note in conversation" :key="note.id" :note="note"/>
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
		<header>
			<mk-avatar class="avatar" :user="p.user"/>
			<div>
				<router-link class="name" :to="p.user | userPage">{{ p.user | userName }}</router-link>
				<span class="username"><mk-acct :user="p.user"/></span>
			</div>
		</header>
		<div class="body">
			<p v-if="p.cw != null" class="cw">
				<span class="text" v-if="p.cw != ''">{{ p.cw }}</span>
				<mk-cw-button v-model="showContent"/>
			</p>
			<div class="content" v-show="p.cw == null || showContent">
				<div class="text">
					<span v-if="p.isHidden" style="opacity: 0.5">(%i18n:@private%)</span>
					<span v-if="p.deletedAt" style="opacity: 0.5">(%i18n:@deleted%)</span>
					<misskey-flavored-markdown v-if="p.text" :text="p.text" :i="$store.state.i"/>
				</div>
				<div class="files" v-if="p.files.length > 0">
					<mk-media-list :media-list="p.files" :raw="true"/>
				</div>
				<mk-poll v-if="p.poll" :note="p"/>
				<mk-url-preview v-for="url in urls" :url="url" :key="url" :detail="true"/>
				<a class="location" v-if="p.geo" :href="`https://maps.google.com/maps?q=${p.geo.coordinates[1]},${p.geo.coordinates[0]}`" target="_blank">%fa:map-marker-alt% %i18n:@location%</a>
				<div class="map" v-if="p.geo" ref="map"></div>
				<div class="renote" v-if="p.renote">
					<mk-note-preview :note="p.renote"/>
				</div>
			</div>
		</div>
		<router-link class="time" :to="p | notePage">
			<mk-time :time="p.createdAt" mode="detail"/>
		</router-link>
		<footer>
			<mk-reactions-viewer :note="p"/>
			<button @click="reply" title="%i18n:@reply%">
				<template v-if="p.reply">%fa:reply-all%</template>
				<template v-else>%fa:reply%</template>
				<p class="count" v-if="p.repliesCount > 0">{{ p.repliesCount }}</p>
			</button>
			<button @click="renote" title="Renote">
				%fa:retweet%<p class="count" v-if="p.renoteCount > 0">{{ p.renoteCount }}</p>
			</button>
			<button :class="{ reacted: p.myReaction != null }" @click="react" ref="reactButton" title="%i18n:@reaction%">
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
import parse from '../../../../../mfm/parse';

import MkNoteMenu from '../../../common/views/components/note-menu.vue';
import MkReactionPicker from '../../../common/views/components/reaction-picker.vue';
import XSub from './note.sub.vue';
import { sum } from '../../../../../prelude/array';

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
			showContent: false,
			conversation: [],
			conversationFetching: false,
			replies: []
		};
	},

	computed: {
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

	methods: {
		fetchConversation() {
			this.conversationFetching = true;

			// Fetch conversation
			(this as any).api('notes/conversation', {
				noteId: this.p.replyId
			}).then(conversation => {
				this.conversationFetching = false;
				this.conversation = conversation.reverse();
			});
		},

		reply() {
			(this as any).apis.post({
				reply: this.p
			});
		},

		renote() {
			(this as any).apis.post({
				renote: this.p
			});
		},

		react() {
			(this as any).os.new(MkReactionPicker, {
				source: this.$refs.reactButton,
				note: this.p,
				compact: true,
				big: true
			});
		},

		menu() {
			(this as any).os.new(MkNoteMenu, {
				source: this.$refs.menuButton,
				note: this.p,
				compact: true
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
	box-shadow 0 0 2px rgba(#000, 0.1)

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

	> .renote
		color var(--renoteText)
		background linear-gradient(to bottom, var(--renoteGradient) 0%, var(--face) 100%)

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
					color #999

				&.reacted
					color var(--primary)

	> .replies
		> *
			border-top 1px solid var(--faceDivider)

</style>

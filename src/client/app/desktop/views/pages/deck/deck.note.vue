<template>
<div class="zyjjkidcqjnlegkqebitfviomuqmseqk" :class="{ renote: isRenote }">
	<div class="reply-to" v-if="p.reply && (!$store.getters.isSignedIn || $store.state.settings.showReplyTarget)">
		<x-sub :note="p.reply"/>
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
		<mk-avatar class="avatar" :user="p.user"/>
		<div class="main">
			<header>
				<router-link class="name" :to="p.user | userPage">{{ p.user | userName }}</router-link>
				<span class="is-admin" v-if="p.user.isAdmin">admin</span>
				<span class="is-bot" v-if="p.user.isBot">bot</span>
				<span class="is-cat" v-if="p.user.isCat">cat</span>
				<span class="username"><mk-acct :user="p.user"/></span>
				<div class="info">
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
					<span class="toggle" @click="showContent = !showContent">{{ showContent ? '%i18n:@less%' : '%i18n:@more%' }}</span>
				</p>
				<div class="content" v-show="p.cw == null || showContent">
					<div class="text">
						<span v-if="p.isHidden" style="opacity: 0.5">(%i18n:@private%)</span>
						<span v-if="p.deletedAt" style="opacity: 0.5">(%i18n:@deleted%)</span>
						<a class="reply" v-if="p.reply">%fa:reply%</a>
						<mk-note-html v-if="p.text && !canHideText(p)" :text="p.text" :i="$store.state.i"/>
						<a class="rp" v-if="p.renote != null">RP:</a>
					</div>
					<div class="media" v-if="p.media.length > 0">
						<mk-media-list :media-list="p.media"/>
					</div>
					<mk-poll v-if="p.poll" :note="p" ref="pollViewer"/>
					<div class="tags" v-if="p.tags && p.tags.length > 0">
						<router-link v-for="tag in p.tags" :key="tag" :to="`/search?q=#${tag}`">{{ tag }}</router-link>
					</div>
					<a class="location" v-if="p.geo" :href="`http://maps.google.com/maps?q=${p.geo.coordinates[1]},${p.geo.coordinates[0]}`" target="_blank">%fa:map-marker-alt% %i18n:@location%</a>
					<div class="renote" v-if="p.renote">
						<mk-note-preview :note="p.renote"/>
					</div>
				</div>
				<span class="app" v-if="p.app">via <b>{{ p.app.name }}</b></span>
			</div>
			<footer>
				<mk-reactions-viewer :note="p" ref="reactionsViewer"/>
				<button @click="reply">
					<template v-if="p.reply">%fa:reply-all%</template>
					<template v-else>%fa:reply%</template>
				</button>
				<button @click="renote" title="Renote">%fa:retweet%</button>
				<button :class="{ reacted: p.myReaction != null }" @click="react" ref="reactButton">%fa:plus%</button>
				<button class="menu" @click="menu" ref="menuButton">%fa:ellipsis-h%</button>
			</footer>
		</div>
	</article>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import parse from '../../../../../../text/parse';
import canHideText from '../../../../common/scripts/can-hide-text';

import MkNoteMenu from '../../../../common/views/components/note-menu.vue';
import MkReactionPicker from '../../../../common/views/components/reaction-picker.vue';
import XSub from './deck.note.sub.vue';

export default Vue.extend({
	components: {
		XSub
	},

	props: ['note'],

	data() {
		return {
			showContent: false,
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
				compact: true
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
@import '~const.styl'

root(isDark)
	font-size 12px
	border-bottom solid 1px isDark ? #1c2023 : #eaeaea

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
		padding 8px 16px
		line-height 28px
		white-space pre
		color #9dbb00
		background isDark ? linear-gradient(to bottom, #314027 0%, #282c37 100%) : linear-gradient(to bottom, #edfde2 0%, #fff 100%)

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
		padding 16px 16px 9px

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

			> header
				display flex
				align-items baseline
				white-space nowrap

				> .avatar
					flex-shrink 0
					margin-right 8px
					width 20px
					height 20px
					border-radius 100%

				> .name
					display block
					margin 0 0.5em 0 0
					padding 0
					overflow hidden
					color isDark ? #fff : #627079
					font-weight bold
					text-decoration none
					text-overflow ellipsis

				> .is-admin
				> .is-bot
				> .is-cat
					align-self center
					margin 0 0.5em 0 0
					padding 1px 6px
					font-size 0.8em
					color isDark ? #758188 : #aaa
					border solid 1px isDark ? #57616f : #ddd
					border-radius 3px

					&.is-admin
						border-color isDark ? #d42c41 : #f56a7b
						color isDark ? #d42c41 : #f56a7b

				> .username
					margin 0 0.5em 0 0
					overflow hidden
					text-overflow ellipsis
					color isDark ? #606984 : #ccc

				> .info
					margin-left auto
					font-size 0.9em

					> *
						color isDark ? #606984 : #c0c0c0

					> .mobile
						margin-right 6px

					> .visibility
						margin-left 6px

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

						[data-is-me]:after
							content "you"
							padding 0 4px
							margin-left 4px
							font-size 80%
							color $theme-color-foreground
							background $theme-color
							border-radius 4px

					.mk-url-preview
						margin-top 8px

					> .tags
						margin 4px 0 0 0

						> *
							display inline-block
							margin 0 8px 0 0
							padding 2px 8px 2px 16px
							font-size 90%
							color #8d969e
							background isDark ? #313543 : #edf0f3
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
								background isDark ? #282c37 : #fff
								border-radius 100%

					> .media
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

						> .mk-note-preview
							padding 16px
							border dashed 1px isDark ? #4e945e : #c0dac6
							border-radius 8px

				> .app
					font-size 12px
					color #ccc

			> footer
				> button
					margin 0
					padding 8px
					background transparent
					border none
					box-shadow none
					font-size 1em
					color isDark ? #606984 : #ddd
					cursor pointer

					&:not(:last-child)
						margin-right 28px

					&:hover
						color isDark ? #9198af : #666

					> .count
						display inline
						margin 0 0 0 8px
						color #999

					&.reacted
						color $theme-color

.zyjjkidcqjnlegkqebitfviomuqmseqk[data-darkmode]
	root(true)

.zyjjkidcqjnlegkqebitfviomuqmseqk:not([data-darkmode])
	root(false)

</style>

<template>
<div class="mk-welcome-timeline">
	<transition-group name="ldzpakcixzickvggyixyrhqwjaefknon" tag="div">
		<div v-for="note in notes" :key="note.id">
			<mk-avatar class="avatar" :user="note.user" target="_blank"/>
			<div class="body">
				<header>
					<router-link class="name" :to="note.user | userPage" v-user-preview="note.user.id">{{ note.user | userName }}</router-link>
					<span class="username">@{{ note.user | acct }}</span>
					<div class="info">
						<router-link class="created-at" :to="note | notePage">
							<mk-time :time="note.createdAt"/>
						</router-link>
					</div>
				</header>
				<div class="text">
					<misskey-flavored-markdown v-if="note.text" :text="note.text"/>
				</div>
			</div>
		</div>
	</transition-group>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		max: {
			type: Number,
			required: false,
			default: undefined
		}
	},

	data() {
		return {
			fetching: true,
			notes: [],
			connection: null,
			connectionId: null
		};
	},

	mounted() {
		this.fetch();

		this.connection = (this as any).os.streams.localTimelineStream.getConnection();
		this.connectionId = (this as any).os.streams.localTimelineStream.use();

		this.connection.on('note', this.onNote);
	},

	beforeDestroy() {
		this.connection.off('note', this.onNote);
		(this as any).os.streams.localTimelineStream.dispose(this.connectionId);
	},

	methods: {
		fetch(cb?) {
			this.fetching = true;
			(this as any).api('notes', {
				limit: this.max,
				local: true,
				reply: false,
				renote: false,
				file: false,
				poll: false
			}).then(notes => {
				this.notes = notes;
				this.fetching = false;
			});
		},

		onNote(note) {
			if (note.replyId != null) return;
			if (note.renoteId != null) return;
			if (note.poll != null) return;

			this.notes.unshift(note);
		},
	}
});
</script>

<style lang="stylus" scoped>
.ldzpakcixzickvggyixyrhqwjaefknon-enter
.ldzpakcixzickvggyixyrhqwjaefknon-leave-to
	opacity 0
	transform translateY(-30px)

root(isDark)
	background isDark ? #282C37 : #fff

	> div
		> *
			transition transform .3s ease, opacity .3s ease

		> div
			padding 16px
			overflow-wrap break-word
			font-size .9em
			color isDark ? #fff : #4C4C4C
			border-bottom 1px solid isDark ? rgba(#000, 0.1) : rgba(#000, 0.05)

			&:after
				content ""
				display block
				clear both

			> .avatar
				display block
				float left
				position -webkit-sticky
				position sticky
				top 16px
				width 42px
				height 42px
				border-radius 6px

			> .body
				float right
				width calc(100% - 42px)
				padding-left 12px

				> header
					display flex
					align-items center
					margin-bottom 4px
					white-space nowrap

					> .name
						display block
						margin 0 .5em 0 0
						padding 0
						overflow hidden
						font-weight bold
						text-overflow ellipsis
						color isDark ? #fff : #627079

					> .username
						margin 0 .5em 0 0
						color isDark ? #606984 : #ccc

					> .info
						margin-left auto
						font-size 0.9em

						> .created-at
							color isDark ? #606984 : #c0c0c0

				> .text
					text-align left

.mk-welcome-timeline[data-darkmode]
	root(true)

.mk-welcome-timeline:not([data-darkmode])
	root(false)

</style>

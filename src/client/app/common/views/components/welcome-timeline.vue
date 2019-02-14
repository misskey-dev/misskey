<template>
<div class="mk-welcome-timeline">
	<transition-group name="ldzpakcixzickvggyixyrhqwjaefknon" tag="div">
		<div v-for="note in notes" :key="note.id">
			<mk-avatar class="avatar" :user="note.user" target="_blank"/>
			<div class="body">
				<header>
					<router-link class="name" :to="note.user | userPage" v-user-preview="note.user.id">
						<mk-user-name :user="note.user"/>
					</router-link>
					<span class="username">@{{ note.user | acct }}</span>
					<div class="info">
						<router-link class="created-at" :to="note | notePage">
							<mk-time :time="note.createdAt"/>
						</router-link>
					</div>
				</header>
				<div class="text">
					<mfm v-if="note.text" :text="note.cw != null ? note.cw : note.text" :author="note.user" :custom-emojis="note.emojis"/>
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
			connection: null
		};
	},

	mounted() {
		this.fetch();

		this.connection = this.$root.stream.useSharedConnection('localTimeline');

		this.connection.on('note', this.onNote);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		fetch(cb?) {
			this.fetching = true;
			this.$root.api('notes', {
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
			if (note.localOnly) return;

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

.mk-welcome-timeline
	background var(--face)

	> div
		> *
			transition transform .3s ease, opacity .3s ease

		> div
			padding 16px
			overflow-wrap break-word
			font-size .9em
			color var(--noteText)
			border-bottom 1px solid var(--faceDivider)

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
						color var(--noteHeaderName)

					> .username
						margin 0 .5em 0 0
						color var(--noteHeaderAcct)

					> .info
						margin-left auto
						font-size 0.9em

						> .created-at
							color var(--noteHeaderInfo)

				> .text
					text-align left

</style>

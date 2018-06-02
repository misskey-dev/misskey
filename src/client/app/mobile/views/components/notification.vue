<template>
<div class="mk-notification">
	<div class="notification reaction" v-if="notification.type == 'reaction'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				<mk-reaction-icon :reaction="notification.reaction"/>
				<router-link :to="notification.user | userPage">{{ notification.user | userName }}</router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
			<router-link class="note-ref" :to="notification.note | notePage">
				%fa:quote-left%{{ getNoteSummary(notification.note) }}
				%fa:quote-right%
			</router-link>
		</div>
	</div>

	<div class="notification renote" v-if="notification.type == 'renote'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				%fa:retweet%
				<router-link :to="notification.user | userPage">{{ notification.user | userName }}</router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
			<router-link class="note-ref" :to="notification.note | notePage">
				%fa:quote-left%{{ getNoteSummary(notification.note.renote) }}%fa:quote-right%
			</router-link>
		</div>
	</div>

	<div class="notification follow" v-if="notification.type == 'follow'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				%fa:user-plus%
				<router-link :to="notification.user | userPage">{{ notification.user | userName }}</router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
		</div>
	</div>

	<div class="notification followRequest" v-if="notification.type == 'receiveFollowRequest'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				%fa:user-clock%
				<router-link :to="notification.user | userPage">{{ notification.user | userName }}</router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
		</div>
	</div>

	<div class="notification poll_vote" v-if="notification.type == 'poll_vote'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				%fa:chart-pie%
				<router-link :to="notification.user | userPage">{{ notification.user | userName }}</router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
			<router-link class="note-ref" :to="notification.note | notePage">
				%fa:quote-left%{{ getNoteSummary(notification.note) }}%fa:quote-right%
			</router-link>
		</div>
	</div>

	<template v-if="notification.type == 'quote'">
		<mk-note :note="notification.note" @update:note="onNoteUpdated"/>
	</template>

	<template v-if="notification.type == 'reply'">
		<mk-note :note="notification.note" @update:note="onNoteUpdated"/>
	</template>

	<template v-if="notification.type == 'mention'">
		<mk-note :note="notification.note" @update:note="onNoteUpdated"/>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getNoteSummary from '../../../../../renderers/get-note-summary';

export default Vue.extend({
	props: ['notification'],
	data() {
		return {
			getNoteSummary
		};
	},
	methods: {
		onNoteUpdated(note) {
			switch (this.notification.type) {
				case 'quote':
				case 'reply':
				case 'mention':
					Vue.set(this.notification, 'note', note);
					break;
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	> .notification
		padding 16px
		font-size 12px
		overflow-wrap break-word

		@media (min-width 350px)
			font-size 14px

		@media (min-width 500px)
			font-size 16px

		@media (min-width 600px)
			padding 24px 32px

		&:after
			content ""
			display block
			clear both

		> .avatar
			display block
			float left
			width 36px
			height 36px
			border-radius 6px

			@media (min-width 500px)
				width 42px
				height 42px

		> div
			float right
			width calc(100% - 36px)
			padding-left 8px

			@media (min-width 500px)
				width calc(100% - 42px)

			> header
				display flex
				align-items baseline
				white-space nowrap

				i, .mk-reaction-icon
					margin-right 4px

				> .mk-time
					margin-left auto
					color isDark ? #606984 : #c0c0c0
					font-size 0.9em

			> .note-preview
				color isDark ? #fff : #717171

			> .note-ref
				color isDark ? #fff : #717171

				[data-fa]
					font-size 1em
					font-weight normal
					font-style normal
					display inline-block
					margin-right 3px

		&.renote
			> div > header i
				color #77B255

		&.follow
			> div > header i
				color #53c7ce

		&.receiveFollowRequest
			> div > header i
				color #888

.mk-notification[data-darkmode]
	root(true)

.mk-notification:not([data-darkmode])
	root(false)

</style>

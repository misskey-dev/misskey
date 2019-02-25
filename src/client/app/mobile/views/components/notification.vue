<template>
<div class="mk-notification">
	<div class="notification reaction" v-if="notification.type == 'reaction'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				<mk-reaction-icon :reaction="notification.reaction"/>
				<router-link :to="notification.user | userPage"><mk-user-name :user="notification.user"/></router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
			<router-link class="note-ref" :to="notification.note | notePage" :title="getNoteSummary(notification.note)">
				<fa icon="quote-left"/>
					<mfm :text="getNoteSummary(notification.note)" :should-break="false" :plain-text="true" :custom-emojis="notification.note.emojis"/>
				<fa icon="quote-right"/>
			</router-link>
		</div>
	</div>

	<div class="notification renote" v-if="notification.type == 'renote'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				<fa icon="retweet"/>
				<router-link :to="notification.user | userPage"><mk-user-name :user="notification.user"/></router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
			<router-link class="note-ref" :to="notification.note | notePage" :title="getNoteSummary(notification.note.renote)">
				<fa icon="quote-left"/>
					<mfm :text="getNoteSummary(notification.note.renote)" :should-break="false" :plain-text="true" :custom-emojis="notification.note.renote.emojis"/>
				<fa icon="quote-right"/>
			</router-link>
		</div>
	</div>

	<div class="notification follow" v-if="notification.type == 'follow'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				<fa icon="user-plus"/>
				<router-link :to="notification.user | userPage"><mk-user-name :user="notification.user"/></router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
		</div>
	</div>

	<div class="notification followRequest" v-if="notification.type == 'receiveFollowRequest'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				<fa icon="user-clock"/>
				<router-link :to="notification.user | userPage"><mk-user-name :user="notification.user"/></router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
		</div>
	</div>

	<div class="notification poll_vote" v-if="notification.type == 'poll_vote'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div>
			<header>
				<fa icon="chart-pie"/>
				<router-link :to="notification.user | userPage"><mk-user-name :user="notification.user"/></router-link>
				<mk-time :time="notification.createdAt"/>
			</header>
			<router-link class="note-ref" :to="notification.note | notePage" :title="getNoteSummary(notification.note)">
				<fa icon="quote-left"/>
					<mfm :text="getNoteSummary(notification.note)" :should-break="false" :plain-text="true" :custom-emojis="notification.note.emojis"/>
				<fa icon="quote-right"/>
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
import getNoteSummary from '../../../../../misc/get-note-summary';

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
.mk-notification
	> .notification
		padding 16px
		font-size 12px
		overflow-wrap break-word

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

		> div
			float right
			width calc(100% - 36px)
			padding-left 8px

			> header
				display flex
				align-items baseline
				white-space nowrap

				[data-icon], .mk-reaction-icon
					margin-right 4px

				> .mk-time
					margin-left auto
					color var(--noteHeaderInfo)
					font-size 0.9em

			> .note-preview
				color var(--noteText)

			> .note-ref
				color var(--noteText)
				display inline-block
				width: 100%
				overflow hidden
				white-space nowrap
				text-overflow ellipsis

				[data-icon]
					font-size 1em
					font-weight normal
					font-style normal
					display inline-block
					margin-right 3px

		&.renote
			> div > header [data-icon]
				color #77B255

		&.follow
			> div > header [data-icon]
				color #53c7ce

		&.receiveFollowRequest
			> div > header [data-icon]
				color #888

</style>

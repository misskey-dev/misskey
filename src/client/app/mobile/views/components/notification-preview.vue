<template>
<div class="mk-notification-preview" :class="notification.type">
	<template v-if="notification.type == 'reaction'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div class="text">
			<p><mk-reaction-icon :reaction="notification.reaction"/>{{ notification.user | userName }}</p>
			<p class="note-ref">%fa:quote-left%{{ getNoteSummary(notification.note) }}%fa:quote-right%</p>
		</div>
	</template>

	<template v-if="notification.type == 'renote'">
		<mk-avatar class="avatar" :user="notification.note.user"/>
		<div class="text">
			<p>%fa:retweet%{{ notification.note.user | userName }}</p>
			<p class="note-ref">%fa:quote-left%{{ getNoteSummary(notification.note.renote) }}%fa:quote-right%</p>
		</div>
	</template>

	<template v-if="notification.type == 'quote'">
		<mk-avatar class="avatar" :user="notification.note.user"/>
		<div class="text">
			<p>%fa:quote-left%{{ notification.note.user | userName }}</p>
			<p class="note-preview">{{ getNoteSummary(notification.note) }}</p>
		</div>
	</template>

	<template v-if="notification.type == 'follow'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div class="text">
			<p>%fa:user-plus%{{ notification.user | userName }}</p>
		</div>
	</template>

	<template v-if="notification.type == 'reciveFollowRequest'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div class="text">
			<p>%fa:user-clock%{{ notification.user | userName }}</p>
		</div>
	</template>

	<template v-if="notification.type == 'reply'">
		<mk-avatar class="avatar" :user="notification.note.user"/>
		<div class="text">
			<p>%fa:reply%{{ notification.note.user | userName }}</p>
			<p class="note-preview">{{ getNoteSummary(notification.note) }}</p>
		</div>
	</template>

	<template v-if="notification.type == 'mention'">
		<mk-avatar class="avatar" :user="notification.note.user"/>
		<div class="text">
			<p>%fa:at%{{ notification.note.user | userName }}</p>
			<p class="note-preview">{{ getNoteSummary(notification.note) }}</p>
		</div>
	</template>

	<template v-if="notification.type == 'poll_vote'">
		<mk-avatar class="avatar" :user="notification.user"/>
		<div class="text">
			<p>%fa:chart-pie%{{ notification.user | userName }}</p>
			<p class="note-ref">%fa:quote-left%{{ getNoteSummary(notification.note) }}%fa:quote-right%</p>
		</div>
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
	}
});
</script>

<style lang="stylus" scoped>
.mk-notification-preview
	margin 0
	padding 8px
	color #fff
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

	> .text
		float right
		width calc(100% - 36px)
		padding-left 8px

		p
			margin 0

			i, mk-reaction-icon
				margin-right 4px

	.note-ref

		[data-fa]
			font-size 1em
			font-weight normal
			font-style normal
			display inline-block
			margin-right 3px

	&.renote, &.quote
		.text p i
			color #77B255

	&.follow
		.text p i
			color #53c7ce

	&.reciveFollowRequest
		.text p i
			color #888

	&.reply, &.mention
		.text p i
			color #fff

</style>


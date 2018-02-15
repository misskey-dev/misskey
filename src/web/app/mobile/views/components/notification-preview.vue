<template>
<div class="mk-notification-preview" :class="notification.type">
	<template v-if="notification.type == 'reaction'">
		<img class="avatar" :src="`${notification.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		<div class="text">
			<p><mk-reaction-icon :reaction="notification.reaction"/>{{ notification.user.name }}</p>
			<p class="post-ref">%fa:quote-left%{{ getPostSummary(notification.post) }}%fa:quote-right%</p>
		</div>
	</template>

	<template v-if="notification.type == 'repost'">
		<img class="avatar" :src="`${notification.post.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		<div class="text">
			<p>%fa:retweet%{{ notification.post.user.name }}</p>
			<p class="post-ref">%fa:quote-left%{{ getPostSummary(notification.post.repost) }}%fa:quote-right%</p>
		</div>
	</template>

	<template v-if="notification.type == 'quote'">
		<img class="avatar" :src="`${notification.post.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		<div class="text">
			<p>%fa:quote-left%{{ notification.post.user.name }}</p>
			<p class="post-preview">{{ getPostSummary(notification.post) }}</p>
		</div>
	</template>

	<template v-if="notification.type == 'follow'">
		<img class="avatar" :src="`${notification.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		<div class="text">
			<p>%fa:user-plus%{{ notification.user.name }}</p>
		</div>
	</template>

	<template v-if="notification.type == 'reply'">
		<img class="avatar" :src="`${notification.post.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		<div class="text">
			<p>%fa:reply%{{ notification.post.user.name }}</p>
			<p class="post-preview">{{ getPostSummary(notification.post) }}</p>
		</div>
	</template>

	<template v-if="notification.type == 'mention'">
		<img class="avatar" :src="`${notification.post.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		<div class="text">
			<p>%fa:at%{{ notification.post.user.name }}</p>
			<p class="post-preview">{{ getPostSummary(notification.post) }}</p>
		</div>
	</template>

	<template v-if="notification.type == 'poll_vote'">
		<img class="avatar" :src="`${notification.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		<div class="text">
			<p>%fa:chart-pie%{{ notification.user.name }}</p>
			<p class="post-ref">%fa:quote-left%{{ getPostSummary(notification.post) }}%fa:quote-right%</p>
		</div>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getPostSummary from '../../../../../common/get-post-summary';

export default Vue.extend({
	props: ['notification'],
	data() {
		return {
			getPostSummary
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

	img
		display block
		float left
		min-width 36px
		min-height 36px
		max-width 36px
		max-height 36px
		border-radius 6px

	.text
		float right
		width calc(100% - 36px)
		padding-left 8px

		p
			margin 0

			i, mk-reaction-icon
				margin-right 4px

	.post-ref

		[data-fa]
			font-size 1em
			font-weight normal
			font-style normal
			display inline-block
			margin-right 3px

	&.repost, &.quote
		.text p i
			color #77B255

	&.follow
		.text p i
			color #53c7ce

	&.reply, &.mention
		.text p i
			color #fff

</style>


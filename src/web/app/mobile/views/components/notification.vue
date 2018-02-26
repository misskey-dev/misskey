<template>
<div class="mk-notification" :class="notification.type">
	<mk-time :time="notification.created_at"/>

	<template v-if="notification.type == 'reaction'">
		<router-link class="avatar-anchor" :to="`/${notification.user.username}`">
			<img class="avatar" :src="`${notification.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		</router-link>
		<div class="text">
			<p>
				<mk-reaction-icon :reaction="notification.reaction"/>
				<router-link :to="`/${notification.user.username}`">{{ notification.user.name }}</router-link>
			</p>
			<router-link class="post-ref" :to="`/${notification.post.user.username}/${notification.post.id}`">
				%fa:quote-left%{{ getPostSummary(notification.post) }}
				%fa:quote-right%
			</router-link>
		</div>
	</template>

	<template v-if="notification.type == 'repost'">
		<router-link class="avatar-anchor" :to="`/${notification.post.user.username}`">
			<img class="avatar" :src="`${notification.post.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		</router-link>
		<div class="text">
			<p>
				%fa:retweet%
				<router-link :to="`/${notification.post.user.username}`">{{ notification.post.user.name }}</router-link>
			</p>
			<router-link class="post-ref" :to="`/${notification.post.user.username}/${notification.post.id}`">
				%fa:quote-left%{{ getPostSummary(notification.post.repost) }}%fa:quote-right%
			</router-link>
		</div>
	</template>

	<template v-if="notification.type == 'quote'">
		<router-link class="avatar-anchor" :to="`/${notification.post.user.username}`">
			<img class="avatar" :src="`${notification.post.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		</router-link>
		<div class="text">
			<p>
				%fa:quote-left%
				<router-link :to="`/${notification.post.user.username}`">{{ notification.post.user.name }}</router-link>
			</p>
			<router-link class="post-preview" :to="`/${notification.post.user.username}/${notification.post.id}`">{{ getPostSummary(notification.post) }}</router-link>
		</div>
	</template>

	<template v-if="notification.type == 'follow'">
		<router-link class="avatar-anchor" :to="`/${notification.user.username}`">
			<img class="avatar" :src="`${notification.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		</router-link>
		<div class="text">
			<p>
				%fa:user-plus%
				<router-link :to="`/${notification.user.username}`">{{ notification.user.name }}</router-link>
			</p>
		</div>
	</template>

	<template v-if="notification.type == 'reply'">
		<router-link class="avatar-anchor" :to="`/${notification.post.user.username}`">
			<img class="avatar" :src="`${notification.post.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		</router-link>
		<div class="text">
			<p>
				%fa:reply%
				<router-link :to="`/${notification.post.user.username}`">{{ notification.post.user.name }}</router-link>
			</p>
			<router-link class="post-preview" :to="`/${notification.post.user.username}/${notification.post.id}`">{{ getPostSummary(notification.post) }}</router-link>
		</div>
	</template>

	<template v-if="notification.type == 'mention'">
		<router-link class="avatar-anchor" :to="`/${notification.post.user.username}`">
			<img class="avatar" :src="`${notification.post.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		</router-link>
		<div class="text">
			<p>
				%fa:at%
				<router-link :to="`/${notification.post.user.username}`">{{ notification.post.user.name }}</router-link>
			</p>
			<router-link class="post-preview" :to="`/${notification.post.user.username}/${notification.post.id}`">{{ getPostSummary(notification.post) }}</router-link>
		</div>
	</template>

	<template v-if="notification.type == 'poll_vote'">
		<router-link class="avatar-anchor" :to="`/${notification.user.username}`">
			<img class="avatar" :src="`${notification.user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		</router-link>
		<div class="text">
			<p>
				%fa:chart-pie%
				<router-link :to="`/${notification.user.username}`">{{ notification.user.name }}</router-link>
			</p>
			<router-link class="post-ref" :to="`/${notification.post.user.username}/${notification.post.id}`">
				%fa:quote-left%{{ getPostSummary(notification.post) }}%fa:quote-right%
			</router-link>
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
.mk-notification
	margin 0
	padding 16px
	overflow-wrap break-word

	> .mk-time
		display inline
		position absolute
		top 16px
		right 12px
		vertical-align top
		color rgba(0, 0, 0, 0.6)
		font-size 12px

	&:after
		content ""
		display block
		clear both

	.avatar-anchor
		display block
		float left

		img
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

			i, .mk-reaction-icon
				margin-right 4px

	.post-preview
		color rgba(0, 0, 0, 0.7)

	.post-ref
		color rgba(0, 0, 0, 0.7)

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
			color #555

		.post-preview
			color rgba(0, 0, 0, 0.7)

</style>


<template>
<div class="mk-welcome-timeline">
	<div v-for="post in posts">
		<router-link class="avatar-anchor" :to="`/@${getAcct(post.user)}`" v-user-preview="post.user.id">
			<img class="avatar" :src="`${post.user.avatarUrl}?thumbnail&size=96`" alt="avatar"/>
		</router-link>
		<div class="body">
			<header>
				<router-link class="name" :to="`/@${getAcct(post.user)}`" v-user-preview="post.user.id">{{ post.user.name }}</router-link>
				<span class="username">@{{ getAcct(post.user) }}</span>
				<div class="info">
					<router-link class="created-at" :to="`/@${getAcct(post.user)}/${post.id}`">
						<mk-time :time="post.createdAt"/>
					</router-link>
				</div>
			</header>
			<div class="text">
				<mk-post-html :text="post.text"/>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getAcct from '../../../../../misc/user/get-acct';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			posts: []
		};
	},
	mounted() {
		this.fetch();
	},
	methods: {
		getAcct,
		fetch(cb?) {
			this.fetching = true;
			(this as any).api('posts', {
				reply: false,
				repost: false,
				media: false,
				poll: false,
				bot: false
			}).then(posts => {
				this.posts = posts;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-welcome-timeline
	background #fff

	> div
		padding 16px
		overflow-wrap break-word
		font-size .9em
		color #4C4C4C
		border-bottom 1px solid rgba(0, 0, 0, 0.05)

		&:after
			content ""
			display block
			clear both

		> .avatar-anchor
			display block
			float left
			position -webkit-sticky
			position sticky
			top 16px

			> img
				display block
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
					color #627079

				> .username
					margin 0 .5em 0 0
					color #ccc

				> .info
					margin-left auto
					font-size 0.9em

					> .created-at
						color #c0c0c0

</style>

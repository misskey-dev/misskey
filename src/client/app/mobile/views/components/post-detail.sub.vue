<template>
<div class="root sub">
	<router-link class="avatar-anchor" :to="`/@${acct}`">
		<img class="avatar" :src="`${post.user.avatarUrl}?thumbnail&size=64`" alt="avatar"/>
	</router-link>
	<div class="main">
		<header>
			<router-link class="name" :to="`/@${acct}`">{{ post.user.name }}</router-link>
			<span class="username">@{{ acct }}</span>
			<router-link class="time" :to="`/@${acct}/${post.id}`">
				<mk-time :time="post.createdAt"/>
			</router-link>
		</header>
		<div class="body">
			<mk-sub-post-content class="text" :post="post"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getAcct from '../../../../../misc/user/get-acct';

export default Vue.extend({
	props: ['post'],
	computed: {
		acct() {
			return getAcct(this.post.user);
		}
	}
});
</script>

<style lang="stylus" scoped>
.root.sub
	padding 8px
	font-size 0.9em
	background #fdfdfd

	@media (min-width 500px)
		padding 12px

	&:after
		content ""
		display block
		clear both

	&:hover
		> .main > footer > button
			color #888

	> .avatar-anchor
		display block
		float left
		margin 0 12px 0 0

		> .avatar
			display block
			width 48px
			height 48px
			margin 0
			border-radius 8px
			vertical-align bottom

	> .main
		float left
		width calc(100% - 60px)

		> header
			display flex
			margin-bottom 4px
			white-space nowrap

			> .name
				display block
				margin 0 .5em 0 0
				padding 0
				overflow hidden
				color #607073
				font-size 1em
				font-weight 700
				text-align left
				text-decoration none
				text-overflow ellipsis

				&:hover
					text-decoration underline

			> .username
				text-align left
				margin 0 .5em 0 0
				color #d1d8da

			> .time
				margin-left auto
				color #b2b8bb

		> .body

			> .text
				cursor default
				margin 0
				padding 0
				font-size 1.1em
				color #717171

</style>


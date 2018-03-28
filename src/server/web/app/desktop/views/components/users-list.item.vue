<template>
<div class="root item">
	<router-link class="avatar-anchor" :to="`/@${acct}`" v-user-preview="user.id">
		<img class="avatar" :src="`${user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
	</router-link>
	<div class="main">
		<header>
			<router-link class="name" :to="`/@${acct}`" v-user-preview="user.id">{{ user.name }}</router-link>
			<span class="username">@{{ acct }}</span>
		</header>
		<div class="body">
			<p class="followed" v-if="user.is_followed">フォローされています</p>
			<div class="description">{{ user.description }}</div>
		</div>
	</div>
	<mk-follow-button :user="user"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getAcct from '../../../../../common/user/get-acct';

export default Vue.extend({
	props: ['user'],
	computed: {
		acct() {
			return getAcct(this.user);
		}
	}
});
</script>

<style lang="stylus" scoped>
.root.item
	padding 16px
	font-size 16px

	&:after
		content ""
		display block
		clear both

	> .avatar-anchor
		display block
		float left
		margin 0 16px 0 0

		> .avatar
			display block
			width 58px
			height 58px
			margin 0
			border-radius 8px
			vertical-align bottom

	> .main
		float left
		width calc(100% - 74px)

		> header
			margin-bottom 2px

			> .name
				display inline
				margin 0
				padding 0
				color #777
				font-size 1em
				font-weight 700
				text-align left
				text-decoration none

				&:hover
					text-decoration underline

			> .username
				text-align left
				margin 0 0 0 8px
				color #ccc

		> .body
			> .followed
				display inline-block
				margin 0 0 4px 0
				padding 2px 8px
				vertical-align top
				font-size 10px
				color #71afc7
				background #eefaff
				border-radius 4px

			> .description
				cursor default
				display block
				margin 0
				padding 0
				overflow-wrap break-word
				font-size 1.1em
				color #717171

	> .mk-follow-button
		position absolute
		top 16px
		right 16px

</style>

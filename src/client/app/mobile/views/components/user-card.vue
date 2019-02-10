<template>
<div class="mk-user-card">
	<header :style="user.bannerUrl ? `background-image: url(${user.bannerUrl})` : ''">
		<mk-avatar class="avatar" :user="user"/>
	</header>
	<a class="name" :href="user | userPage" target="_blank">
		<mk-user-name :user="user"/>
	</a>
	<p class="username"><mk-acct :user="user"/></p>
	<mk-follow-button v-if="$store.getters.isSignedIn && user.id != $store.state.i.id" class="follow-button" :user="user"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['user']
});
</script>

<style lang="stylus" scoped>
.mk-user-card
	display inline-block
	width 200px
	text-align center
	border-radius 8px
	background #fff

	> header
		display block
		height 80px
		background-color #ddd
		background-size cover
		background-position center
		border-radius 8px 8px 0 0

		> .avatar
			position absolute
			top 20px
			left calc(50% - 40px)
			width 80px
			height 80px
			border solid 2px #fff
			border-radius 8px

	> .name
		display block
		margin 24px 0 0 0
		font-size 16px
		color #555

	> .username
		margin 0
		font-size 15px
		color #ccc

	> .follow-button
		display inline-block
		margin 8px 0 16px 0

</style>

<template>
<div class="zvdbznxvfixtmujpsigoccczftvpiwqh">
	<div class="banner" :style="bannerStyle"></div>
	<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
	<mk-follow-button v-if="$store.getters.isSignedIn && user.id != $store.state.i.id" :user="user" class="follow" mini/>
	<div class="body">
		<router-link :to="user | userPage" class="name">
			<mk-user-name :user="user"/>
		</router-link>
		<span class="username">@{{ user | acct }} <fa v-if="user.isLocked == true" class="locked" icon="lock" fixed-width/></span>

		<div class="description">
			<mfm v-if="user.description" :text="user.description" :author="user" :i="$store.state.i" :custom-emojis="user.emojis"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['user'],

	computed: {
		bannerStyle(): any {
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundColor: this.user.bannerColor && this.user.bannerColor.length == 3 ? `rgb(${ this.user.bannerColor.join(',') })` : null,
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		}
	},
});
</script>

<style lang="stylus" scoped>
.zvdbznxvfixtmujpsigoccczftvpiwqh
	$bg = var(--face)

	height 280px
	overflow hidden
	font-size 13px
	background $bg
	box-shadow 0 2px 4px rgba(0, 0, 0, 0.1)
	color var(--faceText)

	> .banner
		height 90px
		background-color #f9f4f4
		background-position center
		background-size cover

	> .avatar
		display block
		margin -40px 0 0 16px
		width 80px
		height 80px
		border-radius 100%
		border solid 4px $bg

	> .follow
		position absolute
		top 16px
		right 16px

	> .body
		padding 0px 24px
		margin-top -40px

		> .name
			font-size 120%
			font-weight bold

		> .username
			display block
			opacity 0.7

			> .locked
				opacity 0.8

		> .description
			margin 8px 0 16px 0

</style>

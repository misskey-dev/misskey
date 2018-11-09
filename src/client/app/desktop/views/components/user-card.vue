<template>
<div class="zvdbznxvfixtmujpsigoccczftvpiwqh">
	<div class="banner" :style="bannerStyle"></div>
	<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
	<mk-follow-button :user="user" class="follow"/>
	<div class="body">
		<router-link :to="user | userPage" class="name">{{ user | userName }}</router-link>
		<span class="username">@{{ user | acct }}</span>
		<div class="description">
			<misskey-flavored-markdown v-if="user.description" :text="user.description" :i="$store.state.i"/>
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
	text-align center
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
		margin -40px auto 0 auto
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

		> .name
			font-size 120%
			font-weight bold

		> .username
			display block
			opacity 0.7

		> .description
			margin 8px 0 16px 0

</style>

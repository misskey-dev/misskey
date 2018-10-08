<template>
<div class="zvdbznxvfixtmujpsigoccczftvpiwqh">
	<div class="banner" :style="bannerStyle"></div>
	<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
	<div class="body">
		<router-link :to="user | userPage" class="name">{{ user | userName }}</router-link>
		<span class="username">@{{ user | acct }}</span>
		<div class="description">
			<misskey-flavored-markdown v-if="user.description" :text="user.description" :i="$store.state.i"/>
		</div>
		<p class="followed" v-if="user.isFollowed">%i18n:@followed%</p>
		<mk-follow-button :user="user" :size="'big'"/>
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
	$bg = #fff

	margin 16px auto
	max-width calc(100% - 32px)
	font-size 16px
	text-align center
	background $bg
	box-shadow 0 2px 4px rgba(0, 0, 0, 0.1)

	> .banner
		height 100px
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

	> .body
		padding 4px 32px 32px 32px

		@media (max-width 400px)
			padding 4px 16px 16px 16px

		> .name
			font-size 20px
			font-weight bold

		> .username
			display block
			opacity 0.7

		> .description
			margin 16px 0

		> .followed
			margin 0 0 16px 0
			padding 0
			line-height 24px
			font-size 0.8em
			color #71afc7
			background #eefaff
			border-radius 4px

</style>

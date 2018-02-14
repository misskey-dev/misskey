<template>
<div class="mk-user-profile">
	<div class="friend-form" v-if="$root.$data.os.isSignedIn && $root.$data.os.i.id != user.id">
		<mk-follow-button :user="user" size="big"/>
		<p class="followed" v-if="user.is_followed">%i18n:desktop.tags.mk-user.follows-you%</p>
		<p v-if="user.is_muted">%i18n:desktop.tags.mk-user.muted% <a @click="unmute">%i18n:desktop.tags.mk-user.unmute%</a></p>
		<p v-if="!user.is_muted"><a @click="mute">%i18n:desktop.tags.mk-user.mute%</a></p>
	</div>
	<div class="description" v-if="user.description">{{ user.description }}</div>
	<div class="birthday" v-if="user.profile.birthday">
		<p>%fa:birthday-cake%{{ user.profile.birthday.replace('-', '年').replace('-', '月') + '日' }} ({{ age }}歳)</p>
	</div>
	<div class="twitter" v-if="user.twitter">
		<p>%fa:B twitter%<a :href="`https://twitter.com/${user.twitter.screen_name}`" target="_blank">@{{ user.twitter.screen_name }}</a></p>
	</div>
	<div class="status">
	  <p class="posts-count">%fa:angle-right%<a>{{ user.posts_count }}</a><b>投稿</b></p>
		<p class="following">%fa:angle-right%<a @click="showFollowing">{{ user.following_count }}</a>人を<b>フォロー</b></p>
		<p class="followers">%fa:angle-right%<a @click="showFollowers">{{ user.followers_count }}</a>人の<b>フォロワー</b></p>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
const age = require('s-age');

export default Vue.extend({
	props: ['user'],
	computed: {
		age(): number {
			return age(this.user.profile.birthday);
		}
	},
	methods: {
		showFollowing() {
			document.body.appendChild(new MkUserFollowingWindow({
				parent: this,
				propsData: {
					user: this.user
				}
			}).$mount().$el);
		},

		showFollowers() {
			document.body.appendChild(new MkUserFollowersWindow({
				parent: this,
				propsData: {
					user: this.user
				}
			}).$mount().$el);
		},

		mute() {
			this.$root.$data.os.api('mute/create', {
				user_id: this.user.id
			}).then(() => {
				this.user.is_muted = true;
			}, e => {
				alert('error');
			});
		},

		unmute() {
			this.$root.$data.os.api('mute/delete', {
				user_id: this.user.id
			}).then(() => {
				this.user.is_muted = false;
			}, e => {
				alert('error');
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-user-profile
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	> *:first-child
		border-top none !important

	> .friend-form
		padding 16px
		border-top solid 1px #eee

		> mk-big-follow-button
			width 100%

		> .followed
			margin 12px 0 0 0
			padding 0
			text-align center
			line-height 24px
			font-size 0.8em
			color #71afc7
			background #eefaff
			border-radius 4px

	> .description
		padding 16px
		color #555
		border-top solid 1px #eee

	> .birthday
		padding 16px
		color #555
		border-top solid 1px #eee

		> p
			margin 0

			> i
				margin-right 8px

	> .twitter
		padding 16px
		color #555
		border-top solid 1px #eee

		> p
			margin 0

			> i
				margin-right 8px

	> .status
		padding 16px
		color #555
		border-top solid 1px #eee

		> p
			margin 8px 0

			> i
				margin-left 8px
				margin-right 8px

</style>

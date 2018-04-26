<template>
<div class="profile">
	<div class="friend-form" v-if="os.isSignedIn && os.i.id != user.id">
		<mk-follow-button :user="user" size="big"/>
		<p class="followed" v-if="user.isFollowed">%i18n:@follows-you%</p>
		<p class="stalk" v-if="user.isFollowing">
			<span v-if="user.isStalking">%i18n:@stalking% <a @click="unstalk">%fa:meh% %i18n:@unstalk%</a></span>
			<span v-if="!user.isStalking"><a @click="stalk">%fa:user-secret% %i18n:@stalk%</a></span>
		</p>
	</div>
	<div class="action-form">
		<button class="mute ui" @click="user.isMuted ? unmute() : mute()">
			<span v-if="user.isMuted">%fa:eye% %i18n:@unmute%</span>
			<span v-if="!user.isMuted">%fa:eye-slash% %i18n:@mute%</span>
		</button>
		<button class="mute ui" @click="list">%fa:list% リストに追加</button>
	</div>
	<div class="description" v-if="user.description">{{ user.description }}</div>
	<div class="birthday" v-if="user.host === null && user.profile.birthday">
		<p>%fa:birthday-cake%{{ user.profile.birthday.replace('-', '年').replace('-', '月') + '日' }} ({{ age }}歳)</p>
	</div>
	<div class="twitter" v-if="user.host === null && user.twitter">
		<p>%fa:B twitter%<a :href="`https://twitter.com/${user.twitter.screenName}`" target="_blank">@{{ user.twitter.screenName }}</a></p>
	</div>
	<div class="status">
		<p class="notes-count">%fa:angle-right%<a>{{ user.notesCount }}</a><b>投稿</b></p>
		<p class="following">%fa:angle-right%<a @click="showFollowing">{{ user.followingCount }}</a>人を<b>フォロー</b></p>
		<p class="followers">%fa:angle-right%<a @click="showFollowers">{{ user.followersCount }}</a>人の<b>フォロワー</b></p>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as age from 's-age';
import MkFollowingWindow from '../../components/following-window.vue';
import MkFollowersWindow from '../../components/followers-window.vue';
import MkUserListsWindow from '../../components/user-lists-window.vue';

export default Vue.extend({
	props: ['user'],
	computed: {
		age(): number {
			return age(this.user.profile.birthday);
		}
	},
	methods: {
		showFollowing() {
			(this as any).os.new(MkFollowingWindow, {
				user: this.user
			});
		},

		showFollowers() {
			(this as any).os.new(MkFollowersWindow, {
				user: this.user
			});
		},

		stalk() {
			(this as any).api('following/stalk', {
				userId: this.user.id
			}).then(() => {
				this.user.isStalking = true;
			}, () => {
				alert('error');
			});
		},

		unstalk() {
			(this as any).api('following/unstalk', {
				userId: this.user.id
			}).then(() => {
				this.user.isStalking = false;
			}, () => {
				alert('error');
			});
		},

		mute() {
			(this as any).api('mute/create', {
				userId: this.user.id
			}).then(() => {
				this.user.isMuted = true;
			}, () => {
				alert('error');
			});
		},

		unmute() {
			(this as any).api('mute/delete', {
				userId: this.user.id
			}).then(() => {
				this.user.isMuted = false;
			}, () => {
				alert('error');
			});
		},

		list() {
			const w = (this as any).os.new(MkUserListsWindow);
			w.$once('choosen', async list => {
				w.close();
				await (this as any).api('users/lists/push', {
					listId: list.id,
					userId: this.user.id
				});
				(this as any).apis.dialog({
					title: 'Done!',
					text: `${this.user.name}を${list.title}に追加しました。`
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.profile
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	> *:first-child
		border-top none !important

	> .friend-form
		padding 16px
		text-align center
		border-top solid 1px #eee

		> .followed
			margin 12px 0 0 0
			padding 0
			text-align center
			line-height 24px
			font-size 0.8em
			color #71afc7
			background #eefaff
			border-radius 4px

		> .stalk
			margin 12px 0 0 0

	> .action-form
		padding 16px
		text-align center
		border-top solid 1px #eee

		> *
			width 100%

			&:not(:last-child)
				margin-bottom 12px

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

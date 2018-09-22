<template>
<div class="profile" v-if="$store.getters.isSignedIn">
	<div class="friend-form" v-if="$store.state.i.id != user.id">
		<mk-follow-button :user="user" size="big"/>
		<p class="followed" v-if="user.isFollowed">%i18n:@follows-you%</p>
		<p class="stalk" v-if="user.isFollowing">
			<span v-if="user.isStalking">%i18n:@stalking% <a @click="unstalk">%fa:meh% %i18n:@unstalk%</a></span>
			<span v-if="!user.isStalking"><a @click="stalk">%fa:user-secret% %i18n:@stalk%</a></span>
		</p>
	</div>
	<div class="action-form">
		<button class="mute ui" @click="user.isMuted ? unmute() : mute()" v-if="$store.state.i.id != user.id">
			<span v-if="user.isMuted">%fa:eye% %i18n:@unmute%</span>
			<span v-if="!user.isMuted">%fa:eye-slash% %i18n:@mute%</span>
		</button>
		<button class="mute ui" @click="list">%fa:list% %i18n:@push-to-a-list%</button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkUserListsWindow from '../../components/user-lists-window.vue';

export default Vue.extend({
	props: ['user'],

	methods: {
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
					text: '%i18n:@list-pushed%'.replace('{user}', this.user.name).replace('{list}', list.title)
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	background isDark ? #282C37 : #fff
	box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

	> *:first-child
		border-top none !important

	> .friend-form
		padding 16px
		text-align center
		border-bottom solid 1px isDark ? #21242f : #eee

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
		border-bottom solid 1px isDark ? #21242f : #eee

		> *
			width 100%

			&:not(:last-child)
				margin-bottom 12px

.profile[data-darkmode]
	root(true)

.profile:not([data-darkmode])
	root(false)

</style>

<template>
<div class="profile" v-if="$store.getters.isSignedIn">
	<div class="friend-form" v-if="$store.state.i.id != user.id">
		<mk-follow-button :user="user" size="big"/>
		<p class="followed" v-if="user.isFollowed">{{ $t('follows-you') }}</p>
		<p class="stalk" v-if="user.isFollowing">
			<span v-if="user.isStalking">{{ $t('stalking% <a @click="unstalk"><fa icon="meh"/> %i18n:@unstalk') }}</a></span>
			<span v-if="!user.isStalking"><a @click="stalk"><fa icon="user-secret"/> {{ $t('stalk') }}</a></span>
		</p>
	</div>
	<div class="action-form">
		<ui-button @click="user.isMuted ? unmute() : mute()" v-if="$store.state.i.id != user.id">
			<span v-if="user.isMuted"><fa icon="eye"/> {{ $t('unmute') }}</span>
			<span v-else><fa icon="eye-slash"/> {{ $t('mute') }}</span>
		</ui-button>
		<ui-button @click="user.isBlocking ? unblock() : block()" v-if="$store.state.i.id != user.id">
			<span v-if="user.isBlocking"><fa icon="user"/> {{ $t('unblock') }}</span>
			<span v-else><fa icon="user-slash"/> {{ $t('block') }}</span>
		</ui-button>
		<ui-button @click="list"><fa icon="list"/> {{ $t('push-to-a-list') }}</ui-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import MkUserListsWindow from '../../components/user-lists-window.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/user/user.profile.vue'),
	props: ['user'],

	methods: {
		stalk() {
			this.$root.api('following/stalk', {
				userId: this.user.id
			}).then(() => {
				this.user.isStalking = true;
			}, () => {
				alert('error');
			});
		},

		unstalk() {
			this.$root.api('following/unstalk', {
				userId: this.user.id
			}).then(() => {
				this.user.isStalking = false;
			}, () => {
				alert('error');
			});
		},

		mute() {
			this.$root.api('mute/create', {
				userId: this.user.id
			}).then(() => {
				this.user.isMuted = true;
			}, () => {
				alert('error');
			});
		},

		unmute() {
			this.$root.api('mute/delete', {
				userId: this.user.id
			}).then(() => {
				this.user.isMuted = false;
			}, () => {
				alert('error');
			});
		},

		block() {
			if (!window.confirm(this.$t('block-confirm'))) return;
			this.$root.api('blocking/create', {
				userId: this.user.id
			}).then(() => {
				this.user.isBlocking = true;
			}, () => {
				alert('error');
			});
		},

		unblock() {
			this.$root.api('blocking/delete', {
				userId: this.user.id
			}).then(() => {
				this.user.isBlocking = false;
			}, () => {
				alert('error');
			});
		},

		list() {
			const w = this.$root.new(MkUserListsWindow);
			w.$once('choosen', async list => {
				w.close();
				await this.$root.api('users/lists/push', {
					listId: list.id,
					userId: this.user.id
				});
				this.$dialog({
					title: 'Done!',
					text: this.$t('list-pushed').replace('{user}', this.user.name).replace('{list}', list.title)
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.profile
	background var(--face)
	box-shadow var(--shadow)
	border-radius var(--round)

	> *:first-child
		border-top none !important

	> .friend-form
		padding 16px
		text-align center
		border-bottom solid 1px var(--faceDivider)

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

		> *
			width 100%

			&:not(:last-child)
				margin-bottom 12px

</style>

<template>
<div class="profile" v-if="$store.getters.isSignedIn">
	<div class="friend-form" v-if="$store.state.i.id != user.id">
		<mk-follow-button :user="user" block/>
		<p class="followed" v-if="user.isFollowed">{{ $t('follows-you') }}</p>
	</div>
	<div class="action-form">
		<ui-button @click="menu" ref="menu">{{ $t('menu') }}</ui-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import XUserMenu from '../../../../common/views/components/user-menu.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/user/user.profile.vue'),
	props: ['user'],

	methods: {
		menu() {
			this.$root.new(XUserMenu, {
				source: this.$refs.menu.$el,
				user: this.user
			});
		},
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
			color var(--text)
			border-radius 4px

	> .action-form
		padding 16px
		text-align center

		> *
			width 100%

			&:not(:last-child)
				margin-bottom 12px

</style>

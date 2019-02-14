<template>
<div class="hozptpaliadatkehcmcayizwzwwctpbc">
	<p class="title"><fa icon="users"/>{{ $t('title') }}</p>
	<p class="initializing" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('loading') }}<mk-ellipsis/></p>
	<template v-if="!fetching && users.length != 0">
		<div class="user" v-for="friend in users">
			<mk-avatar class="avatar" :user="friend"/>
			<div class="body">
				<router-link class="name" :to="friend | userPage" v-user-preview="friend.id"><mk-user-name :user="friend"/></router-link>
				<p class="username">@{{ friend | acct }}</p>
			</div>
		</div>
	</template>
	<p class="empty" v-if="!fetching && users.length == 0">{{ $t('no-users') }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/user/user.friends.vue'),
	props: ['user'],
	data() {
		return {
			users: [],
			fetching: true
		};
	},
	mounted() {
		this.$root.api('users/get_frequently_replied_users', {
			userId: this.user.id,
			limit: 4
		}).then(docs => {
			this.users = docs.map(doc => doc.user);
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.hozptpaliadatkehcmcayizwzwwctpbc
	background var(--face)
	box-shadow var(--shadow)
	border-radius var(--round)
	overflow hidden

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		background var(--faceHeader)
		color var(--faceHeaderText)
		box-shadow 0 1px rgba(#000, 0.07)

		> i
			margin-right 4px

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

		> i
			margin-right 4px

	> .user
		padding 16px
		border-bottom solid 1px var(--faceDivider)

		&:last-child
			border-bottom none

		&:after
			content ""
			display block
			clear both

		> .avatar
			display block
			float left
			margin 0 12px 0 0
			width 42px
			height 42px
			border-radius 8px

		> .body
			float left
			width calc(100% - 54px)

			> .name
				margin 0
				font-size 16px
				line-height 24px
				color var(--text)

			> .username
				display block
				margin 0
				font-size 15px
				line-height 16px
				color var(--text)
				opacity 0.7

</style>

<template>
<div class="vahgrswmbzfdlmomxnqftuueyvwaafth">
	<p class="title"><fa icon="users"/>{{ $t('title') }}</p>
	<p class="initializing" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('loading') }}<mk-ellipsis/></p>
	<div v-if="!fetching && users.length > 0">
	<router-link v-for="user in users" :to="user | userPage" :key="user.id">
		<img :src="user.avatarUrl" :alt="user | userName" v-user-preview="user.id"/>
	</router-link>
	</div>
	<p class="empty" v-if="!fetching && users.length == 0">{{ $t('no-users') }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/user/user.followers-you-know.vue'),
	props: ['user'],
	data() {
		return {
			users: [],
			fetching: true
		};
	},
	mounted() {
		this.$root.api('users/followers', {
			userId: this.user.id,
			iknow: true,
			limit: 16
		}).then(x => {
			this.users = x.users;
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.vahgrswmbzfdlmomxnqftuueyvwaafth
	background var(--face)
	box-shadow var(--shadow)
	border-radius var(--round)

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color var(--faceHeaderText)
		box-shadow 0 1px rgba(#000, 0.07)

		> i
			margin-right 4px

	> div
		padding 8px

		> a
			display inline-block
			margin 4px

			> img
				display inline-block
				text-align center
				width 48px
				height 48px
				vertical-align bottom
				border-radius 100%

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

		> i
			margin-right 4px

</style>

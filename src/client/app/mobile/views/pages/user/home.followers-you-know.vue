<template>
<div class="root followers-you-know">
	<p class="initializing" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
	<div v-if="!fetching && users.length > 0">
		<a v-for="user in users" :key="user.id" :href="user | userPage">
			<img :src="user.avatarUrl" :alt="user | userName"/>
		</a>
	</div>
	<p class="empty" v-if="!fetching && users.length == 0">{{ $t('no-users') }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/user/home.followers-you-know.vue'),
	props: ['user'],
	data() {
		return {
			fetching: true,
			users: []
		};
	},
	mounted() {
		this.$root.api('users/followers', {
			userId: this.user.id,
			iknow: true,
			limit: 30
		}).then(res => {
			this.fetching = false;
			this.users = res.users;
		});
	}
});
</script>

<style lang="stylus" scoped>
.root.followers-you-know

	> div
		padding 4px

		> a
			display inline-block
			margin 4px

			> img
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

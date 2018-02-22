<template>
<mk-ui>
	<span slot="header">
		<template v-if="user">%fa:R comments%{{ user.name }}</template>
		<template v-else><mk-ellipsis/></template>
	</span>
	<mk-messaging-room v-if="!fetching" :user="user" is-naked/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			fetching: true,
			user: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		document.documentElement.style.background = '#fff';
		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;
			(this as any).api('users/show', {
				username: (this as any).$route.params.username
			}).then(user => {
				this.user = user;
				this.fetching = false;

				document.title = `%i18n:mobile.tags.mk-messaging-room-page.message%: ${user.name} | Misskey`;
			});
		}
	}
});
</script>


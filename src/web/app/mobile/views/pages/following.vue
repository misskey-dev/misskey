<template>
<mk-ui>
	<span slot="header" v-if="!fetching">
		<img :src="`${user.avatar_url}?thumbnail&size=64`" alt="">
		{{ '%i18n:mobile.tags.mk-user-following-page.following-of'.replace('{}', user.name) }}
	</span>
	<mk-user-following v-if="!fetching" :user="user" @loaded="onLoaded"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	props: ['username'],
	data() {
		return {
			fetching: true,
			user: null
		};
	},
	mounted() {
		Progress.start();

		this.$root.$data.os.api('users/show', {
			username: this.username
		}).then(user => {
			this.fetching = false;
			this.user = user;

			document.title = '%i18n:mobile.tags.mk-user-followers-page.followers-of%'.replace('{}', user.name) + ' | Misskey';
			document.documentElement.style.background = '#313a42';
		});
	},
	methods: {
		onLoaded() {
			Progress.done();
		}
	}
});
</script>

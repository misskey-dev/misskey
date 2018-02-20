<template>
<mk-ui>
	<div class="user" v-if="!fetching">
		<mk-user-header :user="user"/>
		<mk-user-home v-if="page == 'home'" :user="user"/>
		<mk-user-graphs v-if="page == 'graphs'" :user="user"/>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../../common/scripts/loading';
import MkUserHeader from './user-header.vue';
import MkUserHome from './user-home.vue';

export default Vue.extend({
	components: {
		'mk-user-header': MkUserHeader,
		'mk-user-home': MkUserHome
	},
	props: {
		page: {
			default: 'home'
		}
	},
	data() {
		return {
			fetching: true,
			user: null
		};
	},
	created() {
		this.fetch();
	},
	watch: {
		$route: 'fetch'
	},
	methods: {
		fetch() {
			this.fetching = true;
			Progress.start();
			(this as any).api('users/show', {
				username: this.$route.params.user
			}).then(user => {
				this.user = user;
				this.fetching = false;
				Progress.done();
				document.title = user.name + ' | Misskey';
			});
		}
	}
});
</script>


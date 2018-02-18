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
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	props: {
		username: {
			type: String
		},
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
	mounted() {
		Progress.start();
		(this as any).api('users/show', {
			username: this.username
		}).then(user => {
			this.fetching = false;
			this.user = user;
			Progress.done();
			document.title = user.name + ' | Misskey';
		});
	}
});
</script>


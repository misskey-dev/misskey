<template>
<mk-ui>
	<div class="user" v-if="!fetching">
		<x-header :user="user"/>
		<x-home v-if="page == 'home'" :user="user"/>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../../acct/parse';
import getUserName from '../../../../../../renderers/get-user-name';
import Progress from '../../../../common/scripts/loading';
import XHeader from './user.header.vue';
import XHome from './user.home.vue';

export default Vue.extend({
	components: {
		XHeader,
		XHome
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
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;
			Progress.start();
			(this as any).api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;
				Progress.done();
				document.title = getUserName(user) + ' | Misskey';
			});
		}
	}
});
</script>


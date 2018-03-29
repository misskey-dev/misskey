<template>
<div class="mk-messaging-room-page">
	<mk-messaging-room v-if="user" :user="user" :is-naked="true"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';
import parseAcct from '../../../../../common/user/parse-acct';

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
		this.fetch();
	},
	mounted() {
		document.documentElement.style.background = '#fff';
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			(this as any).api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				document.title = 'メッセージ: ' + this.user.name;

				Progress.done();
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-messaging-room-page
	display flex
	flex 1
	flex-direction column
	min-height 100%
	background #fff

</style>

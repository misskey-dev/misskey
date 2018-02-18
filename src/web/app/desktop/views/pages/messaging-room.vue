<template>
<div class="mk-messaging-room-page">
	<mk-messaging-room v-if="user" :user="user" is-naked/>
</div>
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

		document.documentElement.style.background = '#fff';

		(this as any).api('users/show', {
			username: this.username
		}).then(user => {
			this.fetching = false;
			this.user = user;

			document.title = 'メッセージ: ' + this.user.name;

			Progress.done();
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-messaging-room-page
	background #fff

</style>

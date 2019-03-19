<template>
<div class="mk-messaging-room-page">
	<x-messaging-room v-if="user" :user="user" :is-naked="true"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';
import parseAcct from '../../../../../misc/acct/parse';
import getUserName from '../../../../../misc/get-user-name';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XMessagingRoom: () => import('../../../common/views/components/messaging-room.vue').then(m => m.default)
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
		const applyBg = v =>
			document.documentElement.style.setProperty('background', v ? '#191b22' : '#fff', 'important');

		applyBg(this.$store.state.device.darkmode);

		this.unwatchDarkmode = this.$store.watch(s => {
			return s.device.darkmode;
		}, applyBg);

		this.fetch();
	},
	beforeDestroy() {
		document.documentElement.style.removeProperty('background');
		document.documentElement.style.removeProperty('background-color'); // for safari's bug
		this.unwatchDarkmode();
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			this.$root.api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				document.title = this.$t('@.messaging') + ': ' + getUserName(this.user);

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

</style>

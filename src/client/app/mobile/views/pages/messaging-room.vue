<template>
<mk-ui>
	<span slot="header">
		<template v-if="user">%fa:R comments%{{ user | userName }}</template>
		<template v-else><mk-ellipsis/></template>
	</span>
	<mk-messaging-room v-if="!fetching" :user="user" :is-naked="true"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../acct/parse';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			user: null,
			unwatchDarkmode: null
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
		this.unwatchDarkmode();
	},
	methods: {
		fetch() {
			this.fetching = true;
			(this as any).api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				document.title = `%i18n:@messaging%: ${Vue.filter('userName')(this.user)} | Misskey`;
			});
		}
	}
});
</script>

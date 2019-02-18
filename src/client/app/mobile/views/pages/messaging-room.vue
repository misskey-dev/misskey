<template>
<mk-ui>
	<template #header>
		<template v-if="user"><span style="margin-right:4px;"><fa :icon="['far', 'comments']"/></span><mk-user-name :user="user"/></template>
		<template v-else><mk-ellipsis/></template>
	</template>
	<x-messaging-room v-if="!fetching" :user="user" :is-naked="true"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import parseAcct from '../../../../../misc/acct/parse';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XMessagingRoom: () => import('../../../common/views/components/messaging-room.vue').then(m => m.default)
	},
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
		document.documentElement.style.removeProperty('background-color'); // for safari's bug
		this.unwatchDarkmode();
	},
	methods: {
		fetch() {
			this.fetching = true;
			this.$root.api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				document.title = `${this.$t('@.messaging')}: ${Vue.filter('userName')(this.user)} | ${this.$root.instanceName}`;
			});
		}
	}
});
</script>

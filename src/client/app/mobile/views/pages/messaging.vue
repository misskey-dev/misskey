<template>
<mk-ui :displayPostButton="false">
	<template #header><span style="margin-right:4px;"><fa :icon="['far', 'comments']"/></span>{{ $t('@.messaging') }}</template>
	<x-messaging @navigate="navigate" @navigateGroup="navigateGroup" :createButtonsVisible="false" :header-top="48"/>
	<button class="message button" @click="startUser()"><fa icon="comment"/></button>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import getAcct from '../../../../../misc/acct/render';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XMessaging: () => import('../../../common/views/components/messaging.vue').then(m => m.default)
	},
	mounted() {
		document.title = `${this.$root.instanceName} ${this.$t('@.messaging')}`;
	},
	methods: {
		async startUser() {
			const { result: user } = await this.$root.dialog({
				user: {
					local: true
				}
			});
			if (user == null) return;
			this.navigate(user);
		},
		navigate(user) {
			(this as any).$router.push(`/i/messaging/${getAcct(user)}`);
		},
		navigateGroup(group) {
			(this as any).$router.push(`/i/messaging/group/${group.id}`);
		}
	}
});
</script>

<style lang="stylus" scoped>
.button
	position fixed
	z-index 1000
	bottom 28px
	padding 0
	width 64px
	height 64px
	border-radius 100%
	box-shadow 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12)

	> *
		font-size 24px

	&.message
		right 28px
		background var(--primary)
		color var(--primaryForeground)
</style>

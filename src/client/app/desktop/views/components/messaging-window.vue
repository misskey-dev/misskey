<template>
<mk-window ref="window" width="500px" height="560px" @closed="destroyDom">
	<template #header :class="$style.header"><fa icon="comments"/>{{ $t('@.messaging') }}</template>
	<x-messaging :class="$style.content" @navigate="navigate" @navigateGroup="navigateGroup"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import MkMessagingRoomWindow from './messaging-room-window.vue';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XMessaging: () => import('../../../common/views/components/messaging.vue').then(m => m.default)
	},
	methods: {
		navigate(user) {
			this.$root.new(MkMessagingRoomWindow, {
				user: user
			});
		},
		navigateGroup(group) {
			this.$root.new(MkMessagingRoomWindow, {
				group: group
			});
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> [data-icon]
		margin-right 4px

.content
	height 100%
	overflow auto

</style>

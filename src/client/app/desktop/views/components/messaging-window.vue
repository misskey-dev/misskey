<template>
<mk-window ref="window" width="500px" height="560px" @closed="destroyDom">
	<template #header :class="$style.header"><fa icon="comments"/>{{ $t('title') }}</template>
	<x-messaging :class="$style.content" @navigate="navigate"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import MkMessagingRoomWindow from './messaging-room-window.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/components/messaging-window.vue'),
	components: {
		XMessaging: () => import('../../../common/views/components/messaging.vue').then(m => m.default)
	},
	methods: {
		navigate(user) {
			this.$root.new(MkMessagingRoomWindow, {
				user: user
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

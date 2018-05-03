<template>
<mk-window ref="window" width="500px" height="560px" @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:comments%%i18n:@title%</span>
	<mk-messaging :class="$style.content" @navigate="navigate"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import MkMessagingRoomWindow from './messaging-room-window.vue';

export default Vue.extend({
	methods: {
		navigate(user) {
			(this as any).os.new(MkMessagingRoomWindow, {
				user: user
			});
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> [data-fa]
		margin-right 4px

.content
	height 100%
	overflow auto

</style>

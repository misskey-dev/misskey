<template>
<mk-window ref="window" width="500px" height="560px" :popout-url="popout" @closed="destroyDom">
	<template #header><fa icon="comments"/> {{ $t('title') }} <mk-user-name :user="user"/></template>
	<x-messaging-room :user="user" :class="$style.content"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';
import getAcct from '../../../../../misc/acct/render';

export default Vue.extend({
	i18n: i18n('desktop/views/components/messaging-room-window.vue'),
	components: {
		XMessagingRoom: () => import('../../../common/views/components/messaging-room.vue').then(m => m.default)
	},
	props: ['user'],
	computed: {
		popout(): string {
			return `${url}/i/messaging/${getAcct(this.user)}`;
		}
	}
});
</script>

<style lang="stylus" module>
.content
	height 100%
	overflow auto

</style>

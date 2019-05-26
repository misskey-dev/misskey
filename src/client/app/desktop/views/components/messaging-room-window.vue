<template>
<mk-window ref="window" width="500px" height="560px" :popout-url="popout" @closed="destroyDom">
	<template #header><fa icon="comments"/> {{ $t('@.messaging') }}: <mk-user-name v-if="user" :user="user"/><span v-else>{{ group.name }}</span></template>
	<x-messaging-room :user="user" :group="group" :class="$style.content"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';
import getAcct from '../../../../../misc/acct/render';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XMessagingRoom: () => import('../../../common/views/components/messaging-room.vue').then(m => m.default)
	},
	props: ['user', 'group'],
	computed: {
		popout(): string {
			if (this.user) {
				return `${url}/i/messaging/${getAcct(this.user)}`;
			} else if (this.group) {
				return `${url}/i/messaging/group/${this.group.id}`;
			}
		}
	}
});
</script>

<style lang="stylus" module>
.content
	height 100%
	overflow auto

</style>

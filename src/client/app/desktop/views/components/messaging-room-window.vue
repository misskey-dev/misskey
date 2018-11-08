<template>
<mk-window ref="window" width="500px" height="560px" :popout-url="popout" @closed="destroyDom">
	<span slot="header" :class="$style.header"><fa icon="comments"/>{{ $t('title') }} {{ user | userName }}</span>
	<mk-messaging-room :user="user" :class="$style.content"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';
import getAcct from '../../../../../misc/acct/render';

export default Vue.extend({
	i18n: i18n('desktop/views/components/messaging-room-window.vue'),
	props: ['user'],
	computed: {
		popout(): string {
			return `${url}/i/messaging/${getAcct(this.user)}`;
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

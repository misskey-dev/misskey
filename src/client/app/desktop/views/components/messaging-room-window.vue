<template>
<mk-window ref="window" width="500px" height="560px" :popout-url="popout" @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:comments%%i18n:@title% {{ user | userName }}</span>
	<mk-messaging-room :user="user" :class="$style.content"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import { url } from '../../../config';
import getAcct from '../../../../../acct/render';

export default Vue.extend({
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
	> [data-fa]
		margin-right 4px

.content
	height 100%
	overflow auto

</style>

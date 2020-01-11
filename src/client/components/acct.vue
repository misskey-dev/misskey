<template>
<span class="mk-acct" v-once>
	<span class="name">@{{ user.username }}</span>
	<span class="host" v-if="user.host || detail || $store.state.settings.showFullAcct">@{{ user.host || host }}</span>
	<fa v-if="user.isLocked == true" class="locked" :icon="faLock" fixed-width/>
</span>
</template>

<script lang="ts">
import Vue from 'vue';
import { toUnicode } from 'punycode';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { host } from '../config';

export default Vue.extend({
	props: ['user', 'detail'],
	data() {
		return {
			host: toUnicode(host),
			faLock
		};
	}
});
</script>

<style lang="scss" scoped>
.mk-acct {
	> .host {
		opacity: 0.5;
	}

	> .locked {
		opacity: 0.8;
		margin-left: 0.5em;
	}
}
</style>

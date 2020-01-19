<template>
<span class="mk-acct" v-once>
	<span class="name">@{{ user.username }}</span>
	<span class="host" v-if="user.host || detail || $store.state.settings.showFullAcct">@{{ user.host || host }}</span>
</span>
</template>

<script lang="ts">
import Vue from 'vue';
import { toUnicode } from 'punycode';
import { host } from '../config';

export default Vue.extend({
	props: ['user', 'detail'],
	data() {
		return {
			host: toUnicode(host),
		};
	}
});
</script>

<style lang="scss" scoped>
.mk-acct {
	> .host {
		opacity: 0.5;
	}
}
</style>

<template>
<span class="mk-acct">
	<span class="name">@{{ user.username }}</span>
	<span class="host" v-if="user.host || detail">@{{ user.host || host }}</span>
</span>
</template>

<script lang="ts">
import Vue from 'vue';
import { host } from '../../../config';
export default Vue.extend({
	props: ['user', 'detail'],
	data() {
		return {
			host
		};
	}
});
</script>

<style lang="stylus" scoped>
.mk-acct
	> .host
		opacity 0.5
</style>

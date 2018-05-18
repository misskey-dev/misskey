<template>
<span class="mk-acct">
	<span class="name">@{{ user.username }}</span>
	<span class="host" v-if="user.host">@{{ user.host }}</span>
</span>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user']
});
</script>

<style lang="stylus" scoped>
.mk-acct
	> .host
		opacity 0.5
</style>

<template>
<div class="adsvaidqfznoartcbplullnejvxjphcn">
	<p>%fa:B twitter%<a :href="`https://twitter.com/${user.twitter.screenName}`" target="_blank">@{{ user.twitter.screenName }}</a></p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['user']
});
</script>

<style lang="stylus" scoped>
.adsvaidqfznoartcbplullnejvxjphcn
	padding 32px
	background #1a94f2
	color #fff

</style>

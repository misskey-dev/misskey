<template>
<div class="adsvaidqfznoartcbplullnejvxjphcn">
	<span>%fa:B twitter%<a :href="`https://twitter.com/${user.twitter.screenName}`" target="_blank">@{{ user.twitter.screenName }}</a></span>
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
	border-radius 6px
	color #fff

	a
		margin-left 8px
		color #fff

</style>

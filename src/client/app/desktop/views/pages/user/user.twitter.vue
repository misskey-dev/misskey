<template>
<a class="adsvaidqfznoartcbplullnejvxjphcn" :href="`https://twitter.com/${user.twitter.screenName}`" target="_blank">
	<div>
		<span><fa :icon="['fab', 'twitter']"/>@{{ user.twitter.screenName }}</span>
	</div>
</a>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['user']
});
</script>

<style lang="stylus" scoped>
.adsvaidqfznoartcbplullnejvxjphcn
	margin-left 8px
	color #fff

	div
		padding 32px
		background #1a94f2
		border-radius 6px
		color #fff

</style>

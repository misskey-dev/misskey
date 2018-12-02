<template>
<a class="aqooishiizumijmihokohinatamihoaz" :href="`https://github.com/${user.github.login}`" target="_blank">
	<div>
		<span><fa :icon="['fab', 'github']"/>@{{ user.github.login }}</span>
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
.aqooishiizumijmihokohinatamihoaz
	margin-left 8px
	color #fff

	div
		padding 32px
		background #171515
		border-radius 6px
		color #fff

</style>

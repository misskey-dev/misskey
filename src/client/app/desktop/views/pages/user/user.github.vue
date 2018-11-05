<template>
<div class="aqooishiizumijmihokohinatamihoaz">
	<span><fa :icon="['fab', 'github']"/><a :href="`https://github.com/${user.github.login}`" target="_blank">@{{ user.github.login }}</a></span>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['user']
});
</script>

<style lang="stylus" scoped>
.aqooishiizumijmihokohinatamihoaz
	padding 32px
	background #171515
	border-radius 6px
	color #fff

	a
		margin-left 8px
		color #fff

</style>

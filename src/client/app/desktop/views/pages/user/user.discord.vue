<template>
<div class="lkafjvabenanajk17kwqpsatoushincb">
	<span><fa :icon="['fab', 'discord']"/><a :href="`https://discordapp.com/users/${user.discord.id}`" target="_blank">@{{ user.discord.username }}#{{ user.discord.discriminator }}</a></span>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['user']
});
</script>

<style lang="stylus" scoped>
.lkafjvabenanajk17kwqpsatoushincb
	padding 32px
	background #7289da
	border-radius 6px
	color #fff

	a
		margin-left 8px
		color #fff

</style>

<template>
<a class="lkafjvabenanajk17kwqpsatoushincb" :href="`https://discordapp.com/users/${user.discord.id}`" target="_blank">
	<div>
		<span><fa :icon="['fab', 'discord']"/>@{{ user.discord.username }}#{{ user.discord.discriminator }}</span>
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
.lkafjvabenanajk17kwqpsatoushincb
	margin-left 8px
	color #fff

	div
		padding 32px
		background #7289da
		border-radius 6px
		color #fff

</style>

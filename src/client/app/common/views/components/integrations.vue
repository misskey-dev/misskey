<template>
<div class="nbogcrmo" :v-if="user.twitter || user.github || user.discord">
	<x-integration v-if="user.twitter" service="twitter" :url="`https://twitter.com/${user.twitter.screenName}`" :text="user.twitter.screenName" :icon="['fab', 'twitter']"/>
	<x-integration v-if="user.github" service="github" :url="`https://github.com/${user.github.login}`" :text="user.github.login" :icon="['fab', 'github']"/>
	<x-integration v-if="user.discord" service="discord" :url="`https://discordapp.com/users/${user.discord.id}`" :text="`${user.discord.username}#${user.discord.discriminator}`" :icon="['fab', 'discord']"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XIntegration from './integrations.integration.vue';

export default Vue.extend({
	components: {
		XIntegration
	},
	props: ['user']
});
</script>

<style lang="stylus" scoped>
.nbogcrmo
	> *
		margin-right 10px

</style>

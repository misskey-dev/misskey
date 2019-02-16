<template>
<div class="usertwitxxxgithxxdiscxxxintegrat" :v-if="user.twitter || user.github || user.discord">
	<x-integration v-if="user.twitter" service="twitter" :url="`https://twitter.com/${user.twitter.screenName}`" :text="user.twitter.screenName" :icon="['fab', 'twitter']"/>
	<x-integration v-if="user.github" service="github" :url="`https://github.com/${user.github.login}`" :text="user.github.login" :icon="['fab', 'github']"/>
	<x-integration v-if="user.discord" service="discord" :url="`https://discordapp.com/users/${user.discord.id}`" :text="`${user.discord.username}#${user.discord.discriminator}`" :icon="['fab', 'discord']"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XIntegration from './user.integrations.integration.vue';

export default Vue.extend({
	components: {
		XIntegration
	},
	props: ['user']
});
</script>

<style lang="stylus" scoped>
.usertwitxxxgithxxdiscxxxintegrat
	display flex

	> a
		display flex
		flex 1
		align-items center
		padding 16px
		box-shadow var(--shadow)
		border-radius var(--round)

		&:not(:last-child)
			margin-right 16px

		&:hover
			text-decoration none

		> div
			padding-left .2em
			line-height 1.3em
			flex 1 0
			word-wrap anywhere

		&.twitter
			color #fff
			background #1da1f3

			&:hover
				background #0c87cf

		&.github
			color #fff
			background #171515

			&:hover
				background #000

		&.discord
			color #fff
			background #7289da

			&:hover
				background #4968ce

</style>

<template>
<a class="zxrjzpcj" :href="url" :class="service" target="_blank">
	<fa :icon="icon" size="lg" fixed-width /><span>{{ text }}</span>
</a>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['url', 'text', 'icon', 'service']
});
</script>

<style lang="stylus" scoped>
.zxrjzpcj
	display inline-block
	padding 6px 8px 6px 6px
	margin-top 4px
	margin-bottom 4px
	border-radius 32px
	white-space nowrap

	&:hover
		text-decoration none

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

<template>
<div class="mkw-notifications">
	<template v-if="!props.compact">
		<p class="title">%fa:R bell%%i18n:@title%</p>
		<button @click="settings" title="%i18n:@settings%">%fa:cog%</button>
	</template>
	<mk-notifications/>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'notifications',
	props: () => ({
		compact: false
	})
}).extend({
	methods: {
		settings() {
			alert('not implemented yet');
		},
		func() {
			this.props.compact = !this.props.compact;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-notifications
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> [data-fa]
			margin-right 4px

	> button
		position absolute
		z-index 2
		top 0
		right 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color #ccc

		&:hover
			color #aaa

		&:active
			color #999

	> .mk-notifications
		max-height 300px
		overflow auto

</style>

<template>
<div class="mk-ellipsis-icon">
	<div></div><div></div><div></div>
</div>
</template>

<style lang="stylus" scoped>
.mk-ellipsis-icon
	width 70px
	margin 0 auto
	text-align center

	> div
		display inline-block
		width 18px
		height 18px
		background-color rgba(#000, 0.3)
		border-radius 100%
		animation bounce 1.4s infinite ease-in-out both

		&:nth-child(1)
			animation-delay 0s

		&:nth-child(2)
			margin 0 6px
			animation-delay 0.16s

		&:nth-child(3)
			animation-delay 0.32s

	@keyframes bounce
		0%, 80%, 100%
			transform scale(0)
		40%
			transform scale(1)

</style>

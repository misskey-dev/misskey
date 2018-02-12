<template>
<mk-window ref="window" is-modal width='700px' height='550px' @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:cog%設定</span>
	<div to="content">
		<mk-settings/>
	</div>
</mk-window>
</template>

<style lang="stylus" module>
.header
	> [data-fa]
		margin-right 4px

</style>

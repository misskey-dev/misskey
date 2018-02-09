<mk-file-type-icon>
	<template v-if="kind == 'image'">%fa:file-image%</template>
	<style lang="stylus" scoped>
		:scope
			display inline
	</style>
	<script lang="typescript">
		this.kind = this.opts.type.split('/')[0];
	</script>
</mk-file-type-icon>

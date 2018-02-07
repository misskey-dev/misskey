<mk-file-type-icon>
	<virtual if={ kind == 'image' }>%fa:file-image%</virtual>
	<style lang="stylus" scoped>
		:scope
			display inline
	</style>
	<script>
		this.kind = this.opts.type.split('/')[0];
	</script>
</mk-file-type-icon>

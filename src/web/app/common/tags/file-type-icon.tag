<mk-file-type-icon>
	<virtual v-if="kind == 'image'">%fa:file-image%</virtual>
	<style lang="stylus" scoped>
		:scope
			display inline
	</style>
	<script lang="typescript">
		this.kind = this.opts.type.split('/')[0];
	</script>
</mk-file-type-icon>

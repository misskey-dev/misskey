<mk-file-type-icon>
	<i class="fa fa-file-image-o" if={ kind == 'image' }></i>
	<style>
		:scope
			display inline
	</style>
	<script>
		@kind = @opts.type.split \/ .0
	</script>
</mk-file-type-icon>

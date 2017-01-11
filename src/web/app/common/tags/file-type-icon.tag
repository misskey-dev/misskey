<mk-file-type-icon><i class="fa fa-file-image-o" if={ kind == 'image' }></i>
	<style type="stylus">
		:scope
			display inline

	</style>
	<script>
		@file = @opts.file
		@kind = @file.type.split \/ .0
	</script>
</mk-file-type-icon>

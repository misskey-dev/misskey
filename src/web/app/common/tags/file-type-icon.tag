mk-file-type-icon
	i.fa.fa-file-image-o(if={ kind == 'image' })

style.
	display inline

script.
	@file = @opts.file
	@kind = @file.type.split \/ .0

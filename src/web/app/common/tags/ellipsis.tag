mk-ellipsis
	span .
	span .
	span .

style.
	display inline

	> span
		animation ellipsis 1.4s infinite ease-in-out both

		&:nth-child(1)
			animation-delay 0s

		&:nth-child(2)
			animation-delay 0.16s

		&:nth-child(3)
			animation-delay 0.32s

	@keyframes ellipsis
		0%, 80%, 100%
			opacity 1
		40%
			opacity 0

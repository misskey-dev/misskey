<template>
<span :class="$style.root">
	<span :class="$style.dot">.</span><span :class="$style.dot">.</span><span :class="$style.dot">.</span>
</span>
</template>

<style lang="scss" module>
@keyframes ellipsis {
	0%, 80%, 100% {
		opacity: 1;
	}
	40% {
		opacity: 0;
	}
}

.root {
	
}

.dot {
	animation: ellipsis 1.4s infinite ease-in-out both;

	&:nth-child(1) {
		animation-delay: 0s;
	}

	&:nth-child(2) {
		animation-delay: 0.16s;
	}

	&:nth-child(3) {
		animation-delay: 0.32s;
	}
}
</style>

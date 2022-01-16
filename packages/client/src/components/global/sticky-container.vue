<template>
<div ref="rootEl">
	<slot name="header"></slot>
	<div ref="bodyEl">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';

export default defineComponent({
	props: {
		autoSticky: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	setup(props, context) {
		const rootEl = ref<HTMLElement>(null);
		const bodyEl = ref<HTMLElement>(null);

		const calc = () => {
			const currentStickyTop = getComputedStyle(rootEl.value).getPropertyValue('--stickyTop') || '0px';

			const header = rootEl.value.children[0];
			if (header === bodyEl.value) {
				bodyEl.value.style.setProperty('--stickyTop', currentStickyTop);
			} else {
				bodyEl.value.style.setProperty('--stickyTop', `calc(${currentStickyTop} + ${header.offsetHeight}px)`);

				if (props.autoSticky) {
					header.style.setProperty('--stickyTop', currentStickyTop);
					header.style.position = 'sticky';
					header.style.top = 'var(--stickyTop)';
					header.style.zIndex = '1';
				}
			}
		};

		onMounted(() => {
			calc();

			const observer = new MutationObserver(() => {
				window.setTimeout(() => {
					calc();
				}, 100);
			});

			observer.observe(rootEl.value, {
				attributes: false,
				childList: true,
				subtree: false,
			});

			onUnmounted(() => {
				observer.disconnect();
			});
		});

		return {
			rootEl,
			bodyEl,
		};
	},
});
</script>

<style lang="scss" module>

</style>

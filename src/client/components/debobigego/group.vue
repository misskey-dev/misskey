<template>
<div class="vrtktovg _debobigegoItem _debobigegoNoConcat" v-size="{ max: [500] }" v-sticky-container>
	<div class="_debobigegoLabel"><slot name="label"></slot></div>
	<div class="main _debobigego_group" ref="child">
		<slot></slot>
	</div>
	<div class="_debobigegoCaption"><slot name="caption"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';

export default defineComponent({
	setup(props, context) {
		const child = ref<HTMLElement | null>(null);

		const scanChild = () => {
			if (child.value == null) return;
			const els = Array.from(child.value.children);
			for (let i = 0; i < els.length; i++) {
				const el = els[i];
				if (el.classList.contains('_debobigegoNoConcat')) {
					if (els[i - 1]) els[i - 1].classList.add('_debobigegoNoConcatPrev');
					if (els[i + 1]) els[i + 1].classList.add('_debobigegoNoConcatNext');
				}
			}
		};

		onMounted(() => {
			scanChild();

			const observer = new MutationObserver(records => {
				scanChild();
			});

			observer.observe(child.value, {
				childList: true,
				subtree: false,
				attributes: false,
				characterData: false,
			});
		});

		return {
			child
		};
	}
});
</script>

<style lang="scss" scoped>
.vrtktovg {
	> .main {
		> ::v-deep(*):not(._debobigegoNoConcat) {
			&:not(._debobigegoNoConcatNext) {
				margin: 0;
			}

			&:not(:last-child):not(._debobigegoNoConcatPrev) {
				&._debobigegoPanel, ._debobigegoPanel {
					border-bottom: solid 0.5px var(--divider);
					border-bottom-left-radius: 0;
					border-bottom-right-radius: 0;
				}
			}

			&:not(:first-child):not(._debobigegoNoConcatNext) {
				&._debobigegoPanel, ._debobigegoPanel {
					border-top: none;
					border-top-left-radius: 0;
					border-top-right-radius: 0;
				}
			}
		}
	}
}
</style>

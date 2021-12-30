<template>
<div v-size="{ max: [500] }" class="ssazuxis">
	<header class="_button" :style="{ background: bg }" @click="showBody = !showBody">
		<div class="title"><slot name="header"></slot></div>
		<div class="divider"></div>
		<button class="_button">
			<template v-if="showBody"><i class="fas fa-angle-up"></i></template>
			<template v-else><i class="fas fa-angle-down"></i></template>
		</button>
	</header>
	<transition name="folder-toggle"
		@enter="enter"
		@after-enter="afterEnter"
		@leave="leave"
		@after-leave="afterLeave"
	>
		<div v-show="showBody">
			<slot></slot>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as tinycolor from 'tinycolor2';

const localStoragePrefix = 'ui:folder:';

export default defineComponent({
	props: {
		expanded: {
			type: Boolean,
			required: false,
			default: true
		},
		persistKey: {
			type: String,
			required: false,
			default: null
		},
	},
	data() {
		return {
			bg: null,
			showBody: (this.persistKey && localStorage.getItem(localStoragePrefix + this.persistKey)) ? localStorage.getItem(localStoragePrefix + this.persistKey) === 't' : this.expanded,
		};
	},
	watch: {
		showBody() {
			if (this.persistKey) {
				localStorage.setItem(localStoragePrefix + this.persistKey, this.showBody ? 't' : 'f');
			}
		}
	},
	mounted() {
		function getParentBg(el: Element | null): string {
			if (el == null || el.tagName === 'BODY') return 'var(--bg)';
			const bg = el.style.background || el.style.backgroundColor;
			if (bg) {
				return bg;
			} else {
				return getParentBg(el.parentElement);
			}
		}
		const rawBg = getParentBg(this.$el);
		const bg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
		bg.setAlpha(0.85);
		this.bg = bg.toRgbString();
	},
	methods: {
		toggleContent(show: boolean) {
			this.showBody = show;
		},

		enter(el) {
			const elementHeight = el.getBoundingClientRect().height;
			el.style.height = 0;
			el.offsetHeight; // reflow
			el.style.height = elementHeight + 'px';
		},
		afterEnter(el) {
			el.style.height = null;
		},
		leave(el) {
			const elementHeight = el.getBoundingClientRect().height;
			el.style.height = elementHeight + 'px';
			el.offsetHeight; // reflow
			el.style.height = 0;
		},
		afterLeave(el) {
			el.style.height = null;
		},
	}
});
</script>

<style lang="scss" scoped>
.folder-toggle-enter-active, .folder-toggle-leave-active {
	overflow-y: hidden;
	transition: opacity 0.5s, height 0.5s !important;
}
.folder-toggle-enter-from {
	opacity: 0;
}
.folder-toggle-leave-to {
	opacity: 0;
}

.ssazuxis {
	position: relative;

	> header {
		display: flex;
		position: relative;
		z-index: 10;
		position: sticky;
		top: var(--stickyTop, 0px);
		padding: var(--x-padding);
		-webkit-backdrop-filter: var(--blur, blur(8px));
		backdrop-filter: var(--blur, blur(20px));

		> .title {
			margin: 0;
			padding: 12px 16px 12px 0;

			> i {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .divider {
			flex: 1;
			margin: auto;
			height: 1px;
			background: var(--divider);
		}

		> button {
			padding: 12px 0 12px 16px;
		}
	}

	&.max-width_500px {
		> header {
			> .title {
				padding: 8px 10px 8px 0;
			}
		}
	}
}
</style>

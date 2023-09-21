<template>
<div class="ssazuxis">
	<header class="_button" :style="{ background: bg }" @click="showBody = !showBody">
		<div class="title"><div><slot name="header"></slot></div></div>
		<div class="divider"></div>
		<button class="_button">
			<template v-if="showBody"><i class="ti ti-chevron-up"></i></template>
			<template v-else><i class="ti ti-chevron-down"></i></template>
		</button>
	</header>
	<Transition
		:name="defaultStore.state.animation ? 'folder-toggle' : ''"
		@enter="enter"
		@after-enter="afterEnter"
		@leave="leave"
		@after-leave="afterLeave"
	>
		<div v-show="showBody">
			<slot></slot>
		</div>
	</Transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import tinycolor from 'tinycolor2';
import { miLocalStorage } from '@/local-storage';
import { defaultStore } from '@/store';

const miLocalStoragePrefix = 'ui:folder:' as const;

export default defineComponent({
	props: {
		expanded: {
			type: Boolean,
			required: false,
			default: true,
		},
		persistKey: {
			type: String,
			required: false,
			default: null,
		},
	},
	data() {
		return {
			defaultStore,
			bg: null,
			showBody: (this.persistKey && miLocalStorage.getItem(`${miLocalStoragePrefix}${this.persistKey}`)) ? (miLocalStorage.getItem(`${miLocalStoragePrefix}${this.persistKey}`) === 't') : this.expanded,
		};
	},
	watch: {
		showBody() {
			if (this.persistKey) {
				miLocalStorage.setItem(`${miLocalStoragePrefix}${this.persistKey}`, this.showBody ? 't' : 'f');
			}
		},
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
	},
});
</script>

<style lang="scss" scoped>
.folder-toggle-enter-active, .folder-toggle-leave-active {
	overflow-y: clip;
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
		-webkit-backdrop-filter: var(--blur, blur(8px));
		backdrop-filter: var(--blur, blur(20px));

		> .title {
			display: grid;
			place-content: center;
			margin: 0;
			padding: 12px 16px 12px 0;
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
}

@container (max-width: 500px) {
	.ssazuxis {
		> header {
			> .title {
				padding: 8px 10px 8px 0;
			}
		}
	}
}
</style>

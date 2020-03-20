<template>
<div class="ukygtjoj _panel" :class="{ naked, hideHeader: !showHeader }">
	<header v-if="showHeader">
		<div class="title"><slot name="header"></slot></div>
		<slot name="func"></slot>
		<button class="_button" v-if="bodyTogglable" @click="() => showBody = !showBody">
			<template v-if="showBody"><fa :icon="faAngleUp"/></template>
			<template v-else><fa :icon="faAngleDown"/></template>
		</button>
	</header>
	<transition name="container-toggle"
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
import Vue from 'vue';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	props: {
		showHeader: {
			type: Boolean,
			required: false,
			default: true
		},
		naked: {
			type: Boolean,
			required: false,
			default: false
		},
		bodyTogglable: {
			type: Boolean,
			required: false,
			default: false
		},
		expanded: {
			type: Boolean,
			required: false,
			default: true
		},
	},
	data() {
		return {
			showBody: this.expanded,
			faAngleUp, faAngleDown
		};
	},
	methods: {
		toggleContent(show: boolean) {
			if (!this.bodyTogglable) return;
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
.container-toggle-enter-active, .container-toggle-leave-active {
	overflow-y: hidden;
	transition: opacity 0.5s, height 0.5s !important;
}
.container-toggle-enter {
	opacity: 0;
}
.container-toggle-leave-to {
	opacity: 0;
}

.ukygtjoj {
	position: relative;
	overflow: hidden;

	& + .ukygtjoj {
		margin-top: var(--margin);
	}

	&.naked {
		background: transparent !important;
		box-shadow: none !important;
	}

	> header {
		position: relative;
		box-shadow: 0 1px 0 0 var(--divider);
		z-index: 1;

		> .title {
			margin: 0;
			padding: 12px 16px;

			@media (max-width: 500px) {
				padding: 8px 10px;
			}

			> [data-icon] {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> button {
			position: absolute;
			z-index: 2;
			top: 0;
			right: 0;
			padding: 0;
			width: 42px;
			height: 100%;
		}
	}
}
</style>

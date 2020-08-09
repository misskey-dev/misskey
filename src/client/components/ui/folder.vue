<template>
<div class="ssazuxis" v-size="[{ max: 500 }]">
	<header @click="() => showBody = !showBody" class="_button">
		<div class="title"><slot name="header"></slot></div>
		<div class="divider"></div>
		<button class="_button">
			<template v-if="showBody"><fa :icon="faAngleUp"/></template>
			<template v-else><fa :icon="faAngleDown"/></template>
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
import Vue from 'vue';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	props: {
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
.folder-toggle-enter {
	opacity: 0;
}
.folder-toggle-leave-to {
	opacity: 0;
}

.ssazuxis {
	position: relative;
	overflow: hidden;

	> header {
		display: flex;
		position: relative;
		z-index: 2;

		> .title {
			margin: 0;
			padding: 12px 16px 12px 8px;

			> [data-icon] {
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
			width: 42px;
		}
	}

	&.max-width_500px {
		> header {
			> .title {
				padding: 8px 10px;
			}
		}
	}
}
</style>

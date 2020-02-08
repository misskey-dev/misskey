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
		@before-enter="beforeEnter"
		@enter="enter"
		@after-enter="afterEnter"
		@before-leave="beforeLeave"
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

		beforeEnter(el) {
			el.style.height = '0';
		},
		enter(el) {
			setTimeout(() => {
				el.style.height = el.scrollHeight + 'px';
			}, 10); // HACKY: Vueのバグか知らないけどこうしないと動作しない
		},
		afterEnter(el) {
			el.style.height = 'auto';
		},
		beforeLeave(el) {
			el.style.height = el.scrollHeight + 'px';
		},
		leave(el) {
			setTimeout(() => {
				el.style.height = '0';
			}, 10); // HACKY: Vueのバグか知らないけどこうしないと動作しない
		},
		afterLeave(el) {
			el.style.height = 'auto';
		},
	}
});
</script>

<style lang="scss" scoped>
.container-toggle-enter-active, .container-toggle-leave-active {
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

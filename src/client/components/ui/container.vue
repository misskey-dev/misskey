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
	<div v-show="showBody">
		<slot></slot>
	</div>
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
		}
	}
});
</script>

<style lang="scss" scoped>
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

<template>
<div class="ukygtjoj _panel" :class="{ naked, hideHeader: !showHeader }">
	<header v-if="showHeader" @click="() => showBody = !showBody">
		<div class="title"><slot name="header"></slot></div>
		<slot name="func"></slot>
		<button v-if="bodyTogglable">
			<template v-if="showBody"><fa icon="angle-up"/></template>
			<template v-else><fa icon="angle-down"/></template>
		</button>
	</header>
	<div v-show="showBody">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		showHeader: {
			type: Boolean,
			default: true
		},
		naked: {
			type: Boolean,
			default: false
		},
		bodyTogglable: {
			type: Boolean,
			default: false
		},
		expanded: {
			type: Boolean,
			default: true
		},
	},
	data() {
		return {
			showBody: this.expanded
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
		margin-top: 16px;
	}

	&.naked {
		background: transparent !important;
		box-shadow: none !important;
	}

	> header {
		> .title {
			margin: 0;
			padding: 8px 10px;
			font-size: 15px;
			font-weight: normal;
			color: var(--faceHeaderText);
			background: var(--faceHeader);

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
			font-size: 15px;
			color: var(--faceTextButton);
		}
	}

	> div {
		color: var(--fg);
	}
}
</style>

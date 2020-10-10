<template>
<div class="ebkgoccj _popup" :class="{ noPadding }" @keydown="onKeydown" :style="{ width: `${width}px`, height: height ? `${height}px` : null }">
	<div class="header">
		<button class="_button" v-if="withOkButton" @click="close()"><Fa :icon="faTimes"/></button>
		<span class="title">
			<slot name="header"></slot>
		</span>
		<button class="_button" v-if="!withOkButton" @click="close()"><Fa :icon="faTimes"/></button>
		<button class="_button" v-if="withOkButton" @click="$emit('ok')" :disabled="okButtonDisabled"><Fa :icon="faCheck"/></button>
	</div>
	<div class="body">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';

export default defineComponent({
	props: {
		withOkButton: {
			type: Boolean,
			required: false,
			default: false
		},
		okButtonDisabled: {
			type: Boolean,
			required: false,
			default: false
		},
		noPadding: {
			type: Boolean,
			required: false,
			default: false
		},
		width: {
			type: Number,
			required: false,
			default: 400
		},
		height: {
			type: Number,
			required: false,
			default: null
		},
		canClose: {
			type: Boolean,
			required: false,
			default: true,
		},
	},

	emits: ['close', 'ok'],

	data() {
		return {
			faTimes, faCheck
		};
	},

	methods: {
		close() {
			this.$emit('close');
		},

		onKeydown(e) {
			if (e.which === 27) { // Esc
				e.preventDefault();
				e.stopPropagation();
				this.close();
			}
		},
	}
});
</script>

<style lang="scss" scoped>
.ebkgoccj {
	overflow: hidden;
	display: flex;
	flex-direction: column;

	> .header {
		$height: 58px;
		$height-narrow: 42px;
		display: flex;
		flex-shrink: 0;

		> button {
			height: $height;
			width: $height;

			@media (max-width: 500px) {
				height: $height-narrow;
				width: $height-narrow;
			}
		}

		> .title {
			flex: 1;
			line-height: $height;
			padding-left: 32px;
			font-weight: bold;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			pointer-events: none;

			@media (max-width: 500px) {
				line-height: $height-narrow;
				padding-left: 16px;
			}
		}

		> button + .title {
			padding-left: 0;
		}
	}

	> .body {
		overflow: auto;
	}

	&:not(.noPadding) > .body {
		padding: 0 32px 32px 32px;

		@media (max-width: 500px) {
			padding: 0 16px 16px 16px;
		}
	}
}
</style>

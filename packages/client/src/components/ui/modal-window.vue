<template>
<MkModal ref="modal" @click="$emit('click')" @closed="$emit('closed')">
	<div class="ebkgoccj _window _narrow_" :style="{ width: `${width}px`, height: scroll ? (height ? `${height}px` : null) : (height ? `min(${height}px, 100%)` : '100%') }" @keydown="onKeydown">
		<div class="header">
			<button v-if="withOkButton" class="_button" @click="$emit('close')"><i class="fas fa-times"></i></button>
			<span class="title">
				<slot name="header"></slot>
			</span>
			<button v-if="!withOkButton" class="_button" @click="$emit('close')"><i class="fas fa-times"></i></button>
			<button v-if="withOkButton" class="_button" :disabled="okButtonDisabled" @click="$emit('ok')"><i class="fas fa-check"></i></button>
		</div>
		<div v-if="padding" class="body">
			<div class="_section">
				<slot></slot>
			</div>
		</div>
		<div v-else class="body">
			<slot></slot>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from './modal.vue';

export default defineComponent({
	components: {
		MkModal
	},
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
		padding: {
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
		scroll: {
			type: Boolean,
			required: false,
			default: true,
		},
	},

	emits: ['click', 'close', 'closed', 'ok'],

	data() {
		return {
		};
	},

	methods: {
		close() {
			this.$refs.modal.close();
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
	contain: content;

	--root-margin: 24px;

	@media (max-width: 500px) {
		--root-margin: 16px;
	}

	> .header {
		$height: 58px;
		$height-narrow: 42px;
		display: flex;
		flex-shrink: 0;
		box-shadow: 0px 1px var(--divider);

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
}
</style>

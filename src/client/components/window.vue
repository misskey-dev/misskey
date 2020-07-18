<template>
<x-modal ref="modal" @closed="() => { $emit('closed'); destroyDom(); }" :can-close="canClose">
	<div class="ebkgoccj" :class="{ noPadding }" @keydown="onKeydown" :style="{ width: `${width}px`, height: `${height}px` }">
		<div class="header">
			<button class="_button" v-if="withOkButton" @click="close()"><fa :icon="faTimes"/></button>
			<span class="title">
				<mk-avatar :user="avatar" v-if="avatar" class="avatar"/>
				<slot name="header"></slot>
			</span>
			<button class="_button" v-if="!withOkButton" @click="close()"><fa :icon="faTimes"/></button>
			<button class="_button" v-if="withOkButton" @click="() => { $emit('ok'); close(); }" :disabled="okButtonDisabled"><fa :icon="faCheck"/></button>
		</div>
		<div class="body">
			<slot></slot>
		</div>
	</div>
</x-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import XModal from './modal.vue';

export default Vue.extend({
	components: {
		XModal,
	},

	props: {
		avatar: {
			type: Object,
			required: false
		},
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
			default: 400
		},
		canClose: {
			type: Boolean,
			required: false,
			default: true,
		},
	},

	data() {
		return {
			faTimes, faCheck
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
	background: var(--panel);
	border-radius: var(--radius);
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

			> .avatar {
				$size: 32px;
				height: $size;
				width: $size;
				margin: (($height - $size) / 2) 8px (($height - $size) / 2) 0;

				@media (max-width: 500px) {
					$size: 24px;
					height: $size;
					width: $size;
					margin: (($height-narrow - $size) / 2) 8px (($height-narrow - $size) / 2) 0;
				}
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

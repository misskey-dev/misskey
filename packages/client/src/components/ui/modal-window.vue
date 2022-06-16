<template>
<MkModal ref="modal" :prefer-type="'dialog'" @click="onBgClick" @closed="$emit('closed')">
	<div ref="rootEl" class="ebkgoccj _window _narrow_" :style="{ width: `${width}px`, height: scroll ? (height ? `${height}px` : null) : (height ? `min(${height}px, 100%)` : '100%') }" @keydown="onKeydown">
		<div ref="headerEl" class="header">
			<button v-if="withOkButton" class="_button" @click="$emit('close')"><i class="fas fa-times"></i></button>
			<span class="title">
				<slot name="header"></slot>
			</span>
			<button v-if="!withOkButton" class="_button" @click="$emit('close')"><i class="fas fa-times"></i></button>
			<button v-if="withOkButton" class="_button" :disabled="okButtonDisabled" @click="$emit('ok')"><i class="fas fa-check"></i></button>
		</div>
		<div v-if="padding" class="body">
			<div class="_section">
				<slot :width="bodyWidth" :height="bodyHeight"></slot>
			</div>
		</div>
		<div v-else class="body">
			<slot :width="bodyWidth" :height="bodyHeight"></slot>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import MkModal from './modal.vue';

const props = withDefaults(defineProps<{
	withOkButton: boolean;
	okButtonDisabled: boolean;
	padding: boolean;
	width: number;
	height: number | null;
	scroll: boolean;
}>(), {
	withOkButton: false,
	okButtonDisabled: false,
	padding: false,
	width: 400,
	height: null,
	scroll: true,
});

const emit = defineEmits<{
	(event: 'click'): void;
	(event: 'close'): void;
	(event: 'closed'): void;
	(event: 'ok'): void;
}>();

let modal = $ref<InstanceType<typeof MkModal>>();
let rootEl = $ref<HTMLElement>();
let headerEl = $ref<HTMLElement>();
let bodyWidth = $ref(0);
let bodyHeight = $ref(0);

const close = () => {
	modal.close();
};

const onBgClick = () => {
	emit('click');
};

const onKeydown = (evt) => {
	if (evt.which === 27) { // Esc
		evt.preventDefault();
		evt.stopPropagation();
		close();
	}
};

const ro = new ResizeObserver((entries, observer) => {
	bodyWidth = rootEl.offsetWidth;
	bodyHeight = rootEl.offsetHeight - headerEl.offsetHeight;
});

onMounted(() => {
	bodyWidth = rootEl.offsetWidth;
	bodyHeight = rootEl.offsetHeight - headerEl.offsetHeight;
	ro.observe(rootEl);
});

onUnmounted(() => {
	ro.disconnect();
});

defineExpose({
	close,
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

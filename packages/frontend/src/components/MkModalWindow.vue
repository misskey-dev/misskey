<template>
<MkModal ref="modal" :prefer-type="'dialog'" @click="onBgClick" @closed="$emit('closed')">
	<div ref="rootEl" class="ebkgoccj" :style="{ width: `${width}px`, height: scroll ? (height ? `${height}px` : null) : (height ? `min(${height}px, 100%)` : '100%') }" @keydown="onKeydown">
		<div ref="headerEl" class="header">
			<button v-if="withOkButton" class="_button" @click="$emit('close')"><i class="ti ti-x"></i></button>
			<span class="title">
				<slot name="header"></slot>
			</span>
			<button v-if="!withOkButton" class="_button" @click="$emit('close')"><i class="ti ti-x"></i></button>
			<button v-if="withOkButton" class="_button" :disabled="okButtonDisabled" @click="$emit('ok')"><i class="ti ti-check"></i></button>
		</div>
		<div class="body">
			<slot :width="bodyWidth" :height="bodyHeight"></slot>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import MkModal from './MkModal.vue';

const props = withDefaults(defineProps<{
	withOkButton: boolean;
	okButtonDisabled: boolean;
	width: number;
	height: number | null;
	scroll: boolean;
}>(), {
	withOkButton: false,
	okButtonDisabled: false,
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

let modal = $shallowRef<InstanceType<typeof MkModal>>();
let rootEl = $shallowRef<HTMLElement>();
let headerEl = $shallowRef<HTMLElement>();
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
	margin: auto;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	contain: content;
	container-type: inline-size;
	border-radius: var(--radius);

	--root-margin: 24px;

	@media (max-width: 500px) {
		--root-margin: 16px;
	}

	> .header {
		$height: 46px;
		$height-narrow: 42px;
		display: flex;
		flex-shrink: 0;
		background: var(--windowHeader);
		-webkit-backdrop-filter: var(--blur, blur(15px));
		backdrop-filter: var(--blur, blur(15px));

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
		flex: 1;
		overflow: auto;
		background: var(--panel);
	}
}
</style>

<template>
<MkModal
	ref="modal"
	v-slot="{ type }"
	zPriority="high"
	:transparentBg="true"
	:anchorElement="anchorElement"
	@click="modal?.close()"
	@closed="emit('closed')"
	@esc="modal?.close()"
>
	<div class="_popup _shadow" :class="{ [$style.root]: true, [$style.asDrawer]: type === 'drawer' }">
		<div :class="[$style.label, $style.item]">
			{{ i18n.ts._hana._searchMode.title }}
		</div>
		<button key="public" class="_button" :class="[$style.item, { [$style.active]: v === 'v0' }]" data-index="1" @click="choose('v0')">
			<div :class="$style.icon">
				<i class="ti ti-search"></i>
			</div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">Meilisearch (v0)</span>
				<MkCondensedLine :minScale="0.8">{{ i18n.ts._hana._searchMode.v0Description }}</MkCondensedLine>
			</div>
		</button>
		<button key="v1" class="_button" :class="[$style.item, { [$style.active]: v === 'v1' }]" data-index="2" @click="choose('v1')">
			<div :class="$style.icon"><i class="ti ti-filter-search"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">HanamiSearch v1</span>
				<MkCondensedLine :minScale="0.8">{{ i18n.ts._hana._searchMode.v1Description }}</MkCondensedLine>
			</div>
		</button>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { nextTick, shallowRef, ref } from 'vue';
import MkModal from '@/components/MkModal.vue';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i.js';
import type { SearchMode } from '@/hana/types/search.js';

const $i = ensureSignin();

const modal = shallowRef<InstanceType<typeof MkModal>>();

const props = withDefaults(defineProps<{
	currentMode: SearchMode;
	anchorElement?: HTMLElement;
}>(), {
});

const emit = defineEmits<{
	(ev: 'changeMode', v: SearchMode): void;
	(ev: 'closed'): void;
}>();

const v = ref(props.currentMode);

function choose(mode: SearchMode): void {
	v.value = mode;
	emit('changeMode', mode);
	nextTick(() => {
		if (modal.value) modal.value.close();
	});
}
</script>

<style lang="scss" module>
.root {
	min-width: 240px;
	max-width: 300px;
	padding: 8px 0;

	&.asDrawer {
		padding: 12px 0 max(env(safe-area-inset-bottom, 0px), 12px) 0;
		width: 100%;
		max-width: none;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;

		.label {
			pointer-events: none;
			font-size: 12px;
			padding-bottom: 4px;
			opacity: 0.7;
		}

		.item {
			font-size: 14px;
			padding: 10px 24px;
		}
	}
}

.label {
	pointer-events: none;
	font-size: 10px;
	padding-bottom: 4px;
	opacity: 0.7;
}

.item {
	display: flex;
	padding: 8px 14px;
	font-size: 12px;
	text-align: left;
	width: 100%;
	box-sizing: border-box;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	&:active {
		background: rgba(0, 0, 0, 0.1);
	}

	&.active {
		color: var(--MI_THEME-accent);
	}
}

.icon {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-right: 10px;
	width: 16px;
	top: 0;
	bottom: 0;
	margin-top: auto;
	margin-bottom: auto;
}

.body {
	flex: 1 1 auto;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.itemTitle {
	display: block;
	font-weight: bold;
}

.itemDescription {
	opacity: 0.6;
}
</style>

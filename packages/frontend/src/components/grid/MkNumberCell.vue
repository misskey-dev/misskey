<template>
<th :class="[$style.num, [top ? {} : $style.border]]" @mouseup="onMouseUp">
	{{ content }}
</th>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { GridRow } from '@/components/grid/types.js';

const emit = defineEmits<{
	(ev: 'selection:row', sender: GridRow): void;
}>();

const props = defineProps<{
	content: string,
	row?: GridRow,
	selectable: boolean,
	top?: boolean,
}>();

const { content, row, selectable } = toRefs(props);

function onMouseUp(ev: MouseEvent) {
	switch (ev.type) {
		case 'mouseup': {
			if (selectable.value && row.value) {
				emit('selection:row', row.value);
			}
			break;
		}
	}
}
</script>

<style module lang="scss">
.num {
	padding: 0 8px;
	min-width: 30px;
	width: 30px;
}

.border {
	border-top: solid 0.5px var(--divider);
}
</style>

<template>
<span v-if="menuName" :class="$style.menuRoot">
	<span :class="$style.menuCode">
		{{ canonicalMenuCode }}<span v-if="menuCode.toUpperCase() !== canonicalMenuCode" :class="$style.menuCodeOriginal">&nbsp;({{ menuCode.toUpperCase() }})</span>
	</span>
	{{ menuName }}
</span>
<span v-else>{{ menuCode }}</span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
	menuCode: string;
}>();

const menuName = ref<string | null>(null);
const canonicalMenuCode = ref<string | null>(null);

async function fetchMenuName() {
	const response = await fetch(`https://saize-static-assets.misskey.flowers/${props.menuCode.toUpperCase()}.json`);
	if (!response.ok) return;
	const data = await response.json() as { id: number; name: string; };
	menuName.value = data.name;
	canonicalMenuCode.value = data.id.toString().padStart(4, '0');
}

watch(() => props.menuCode, (to) => {
	menuName.value = null;
	canonicalMenuCode.value = null;
	if (/^[a-zA-Z0-9]{2}[0-9]{2}$/.test(to)) {
		fetchMenuName();
	}
}, { immediate: true });
</script>

<style module>
.menuRoot {
	display: inline-block;
	box-sizing: border-box;
	border: 2px solid #0aa546;
	padding-right: 0.2em;
	border-radius: 6px;
	background-color: #0aa546;
	color: var(--MI_THEME-fgOnAccent);
	font-weight: 700;
	font-size: .8em;
	line-height: calc(1.75em - 4px);
	height: 1.75em;
}

.menuCode {
	display: inline-block;
	box-sizing: border-box;
	text-align: center;
	padding: 0 0.4em;
	border-radius: 4px;
	margin-right: 0.2em;
	line-height: calc(1.75em - 4px);
	height: 100%;
	background-color: var(--MI_THEME-panel);
	color: #0aa546;
}

.menuCodeOriginal {
	font-size: 0.9em;
	opacity: 0.7;
	line-height: 0.9em;
}
</style>

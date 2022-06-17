<template>
<span class="mk-file-type-icon">
	<template v-if="kind == 'image'"><i class="ph-file-image"></i></template>
</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
	type: string;
}>();

const kind = computed(() => props.type.split('/')[0]);
</script>

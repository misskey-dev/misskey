<template>
<div class="zhyxdalp">
	<XValue :value="value" :collapsed="false"/>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XValue from './MkObjectView.value.vue';

const props = defineProps<{
	value: Record<string, unknown>;
}>();
</script>

<style lang="scss" scoped>
.zhyxdalp {

}
</style>

<template>
<!-- このコンポーネントの要素のclassは親から利用されるのでむやみに弄らないこと -->
<section>
	<header class="_acrylic" @click="shown = !shown">
		<i class="toggle ti-fw" :class="shown ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i> <slot></slot> ({{ emojis.length }})
	</header>
	<div v-if="shown" class="body">
		<button
			v-for="emoji in emojis"
			:key="emoji"
			class="_button item"
			@click="emit('chosen', emoji, $event)"
		>
			<MkEmoji class="emoji" :emoji="emoji" :normal="true"/>
		</button>
	</div>
</section>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
	emojis: string[];
	initialShown?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'chosen', v: string, event: MouseEvent): void;
}>();

const shown = ref(!!props.initialShown);
</script>

<style lang="scss" scoped>
</style>

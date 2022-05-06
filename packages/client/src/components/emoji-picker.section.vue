<template>
<section>
	<header class="_acrylic" @click="shown = !shown">
		<i class="toggle fa-fw" :class="shown ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"></i> <slot></slot> ({{ emojis.length }})
	</header>
	<div v-if="shown">
		<button v-for="emoji in emojis"
			:key="emoji"
			class="_button"
			@click="emit('chosen', emoji, $event)"
		>
			<MkEmoji :emoji="emoji" :normal="true"/>
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

<template>
<MkTooltip ref="tooltip" :source="source" :max-width="340" @closed="emit('closed')">
	<div class="beeadbfb">
		<XReactionIcon :reaction="reaction" :custom-emojis="emojis" class="icon" :no-style="true"/>
		<div class="name">{{ reaction.replace('@.', '') }}</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkTooltip from './ui/tooltip.vue';
import XReactionIcon from './reaction-icon.vue';

const props = defineProps<{
	reaction: string;
	emojis: any[]; // TODO
	source: any; // TODO
}>();

const emit = defineEmits<{
	(e: 'closed'): void;
}>();
</script>

<style lang="scss" scoped>
.beeadbfb {
	text-align: center;

	> .icon {
		display: block;
		width: 60px;
		font-size: 60px; // unicodeな絵文字についてはwidthが効かないため
		margin: 0 auto;
	}

	> .name {
		font-size: 0.9em;
	}
}
</style>

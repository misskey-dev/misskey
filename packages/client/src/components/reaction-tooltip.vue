<template>
<MkTooltip ref="tooltip" :source="source" :max-width="340" @closed="$emit('closed')">
	<div class="beeadbfb">
		<XReactionIcon :reaction="reaction" :custom-emojis="emojis" class="icon" :no-style="true"/>
		<div class="name">{{ reaction.replace('@.', '') }}</div>
	</div>
</MkTooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkTooltip from './ui/tooltip.vue';
import XReactionIcon from './reaction-icon.vue';

export default defineComponent({
	components: {
		MkTooltip,
		XReactionIcon,
	},
	props: {
		reaction: {
			type: String,
			required: true,
		},
		emojis: {
			type: Array,
			required: true,
		},
		source: {
			required: true,
		}
	},
	emits: ['closed'],
})
</script>

<style lang="scss" scoped>
.beeadbfb {
	text-align: center;

	> .icon {
		display: block;
		width: 60px;
		margin: 0 auto;
	}

	> .name {
		font-size: 0.9em;
	}
}
</style>

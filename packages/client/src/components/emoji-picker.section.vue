<template>
<section>
	<header class="_acrylic" @click="shown = !shown">
		<i class="toggle fa-fw" :class="shown ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"></i> <slot></slot> ({{ emojis.length }})
	</header>
	<div v-if="shown">
		<button v-for="emoji in emojis"
			:key="emoji"
			class="_button"
			@click="chosen(emoji, $event)"
		>
			<MkEmoji :emoji="emoji" :normal="true"/>
		</button>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';

export default defineComponent({
	props: {
		emojis: {
			required: true,
		},
		initialShown: {
			required: false
		}
	},

	emits: ['chosen'],

	data() {
		return {
			getStaticImageUrl,
			shown: this.initialShown,
		};
	},

	methods: {
		chosen(emoji: any, ev) {
			this.$parent.chosen(emoji, ev);
		},
	}
});
</script>

<style lang="scss" scoped>
</style>

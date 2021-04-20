<template>
<section>
	<header class="_acrylic" @click="shown = !shown">
		<Fa :icon="shown ? faChevronDown : 'fas fa-chevron-up'" :key="shown" fixed-width class="toggle"/> <slot></slot> ({{ emojis.length }})
	</header>
	<div v-if="shown">
		<button v-for="emoji in emojis"
			class="_button"
			@click="chosen(emoji, $event)"
			:key="emoji"
		>
			<MkEmoji :emoji="emoji" :normal="true"/>
		</button>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { getStaticImageUrl } from '@client/scripts/get-static-image-url';

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
			faChevronUp, faChevronDown,
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

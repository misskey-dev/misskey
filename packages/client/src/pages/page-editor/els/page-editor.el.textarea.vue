<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-align-left"></i> {{ $ts._pages.blocks.textarea }}</template>

	<section class="ihymsbbe">
		<textarea v-model="value.text"></textarea>
	</section>
</XContainer>
</template>

<script lang="ts">
/* eslint-disable vue/no-mutating-props */
import { defineComponent } from 'vue';
import XContainer from '../page-editor.container.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer
	},

	props: {
		value: {
			required: true
		},
	},

	data() {
		return {
		};
	},

	created() {
		if (this.value.text == null) this.value.text = '';
	},
});
</script>

<style lang="scss" scoped>
.ihymsbbe {
	> textarea {
		display: block;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		width: 100%;
		min-width: 100%;
		min-height: 150px;
		border: none;
		box-shadow: none;
		padding: 16px;
		background: transparent;
		color: var(--fg);
		font-size: 14px;
		box-sizing: border-box;
	}
}
</style>

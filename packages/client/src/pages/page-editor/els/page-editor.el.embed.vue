<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-code"></i> {{ '$ts._pages.blocks.embed' }}</template>

	<section style="padding: 0 16px 0 16px;">
		<MkSelect v-model="value.embedType" style="margin: 0 10px 0 0; flex: 1;" placeholder="$ts.selectType">
			<option value="URL">URL</option>
			<option value="HTML">HTML</option>
		</MkSelect>
		<MkInput v-show="value.embedType === 'URL'" v-model="value.url" type="url"><template #prefix><i class="fas fa-link"></i></template><template #label>{{ '$ts._pages.blocks._embed.url' }}</template></MkInput>
		<section class="udsnsqwy" v-show="value.embedType === 'HTML'">
			<textarea v-model="value.srcdoc"></textarea>
		</section>
		<MkInput v-model="value.height" type="number"><template #label>{{ '$ts._pages.blocks._embed.height' }}</template></MkInput>
		<MkInput v-model="value.backgroundColor" type="text"><template #label>{{ '$ts._pages.blocks._embed.backgroundColor' }}</template></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkInput from '@/components/form/input.vue';
import MkSelect from '@/components/form/select.vue';

withDefaults(defineProps<{
	value: any
}>(), {
	value: {
		embedType: 'HTML',
		url: undefined,
		srcdoc: undefined,
		height: undefined,
		backgroundColor: undefined,
	}
});
</script>


<style lang="scss" scoped>
.udsnsqwy {
	> textarea {
		display: block;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		width: 100%;
		min-width: 100%;
		min-height: 150px;
		border: 4px;
		box-shadow: none;
		padding: 16px;
		background: transparent;
		color: var(--fg);
		font-size: 14px;
		box-sizing: border-box;
	}
}
</style>

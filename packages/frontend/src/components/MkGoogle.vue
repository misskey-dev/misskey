<template>
<div class="mk-google">
	<input v-model="query" type="search" :placeholder="q">
	<button @click="search"><i class="ti ti-search"></i> {{ $ts.searchByGoogle }}</button>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
	q: string;
}>();

const query = ref(props.q);

const search = () => {
	window.open(`https://www.google.com/search?q=${query.value}`, '_blank');
};
</script>

<style lang="scss" scoped>
.mk-google {
	display: flex;
	margin: 8px 0;

	> input {
		flex-shrink: 1;
		padding: 10px;
		width: 100%;
		height: 40px;
		font-size: 16px;
		border: solid 1px var(--divider);
		border-radius: 4px 0 0 4px;
		-webkit-appearance: textfield;
	}

	> button {
		flex-shrink: 0;
		margin: 0;
		padding: 0 16px;
		border: solid 1px var(--divider);
		border-left: none;
		border-radius: 0 4px 4px 0;

		&:active {
			box-shadow: 0 2px 4px rgba(#000, 0.15) inset;
		}
	}
}
</style>

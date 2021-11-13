<template>
<div class="mk-google">
	<input type="search" v-model="query" :placeholder="q">
	<button @click="search"><i class="fas fa-search"></i> {{ $ts.search }}</button>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	props: {
		q: {
			type: String,
			required: true,
		}
	},
	data() {
		return {
			query: null,
		};
	},
	mounted() {
		this.query = this.q;
	},
	methods: {
		search() {
			window.open(`https://www.google.com/search?q=${this.query}`, '_blank');
		}
	}
});
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

<template>
<div class="mk-google">
	<input type="search" v-model="query" :placeholder="q">
	<button @click="search"><Fa :icon="faSearch"/> {{ $ts.search }}</button>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';

export default defineComponent({
	props: ['q'],
	data() {
		return {
			query: null,
			faSearch
		};
	},
	mounted() {
		this.query = this.q;
	},
	methods: {
		search() {
			const engine = this.$store.state.webSearchEngine ||
				'https://www.google.com/search?q={{query}}';
			const url = engine.replace('{{query}}', this.query)
			window.open(url, '_blank');
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

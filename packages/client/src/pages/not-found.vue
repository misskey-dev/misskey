<template>
<div class="ipledcug">
	<div class="_fullinfo">
		<img src="https://xn--931a.moe/assets/not-found.jpg" class="_ghost"/>
		<div>{{ $ts.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.notFound,
				icon: 'fas fa-exclamation-triangle'
			},
		}
	},
});
</script>

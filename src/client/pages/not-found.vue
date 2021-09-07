<template>
<div class="ipledcug">
	<div class="_fullinfo">
		<img data-src="/assets/not-found.jpg" loading="lazy" alt="Not Found" class="_ghost"/>
		<div>{{ $ts.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

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

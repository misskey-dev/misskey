<template>
<div>
	<section class="_section">
		<div class="_content" style="text-align: center;">
			<img src="/static-assets/icons/512.png" alt="" style="display: block; width: 100px; margin: 0 auto; border-radius: 16px;"/>
			<div style="margin-top: 0.75em;">Misskey</div>
			<div style="opacity: 0.5;">v{{ version }}</div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { version } from '@client/config';
import * as symbols from '@client/symbols';

export default defineComponent({
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: 'Misskey',
				icon: null
			},
			version,
			faInfoCircle
		}
	},
});
</script>

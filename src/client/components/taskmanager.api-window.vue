<template>
<XWindow ref="window"
	:initial-width="370"
	:initial-height="450"
	:can-resize="true"
	@close="$refs.window.close()"
	@closed="$emit('closed')"
>
	<template #header>Req Viewer</template>

	<div class="rlkneywz">
		<MkTab v-model:value="tab" style="border-bottom: solid 1px var(--divider);">
			<option value="req">Request</option>
			<option value="res">Response</option>
		</MkTab>

		<code v-if="tab === 'req'" class="_monospace">{{ reqStr }}</code>
		<code v-if="tab === 'res'" class="_monospace">{{ resStr }}</code>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as JSON5 from 'json5';
import XWindow from '@client/components/ui/window.vue';
import MkTab from '@client/components/tab.vue';

export default defineComponent({
	components: {
		XWindow,
		MkTab,
	},

	props: {
		req: {
			required: true,
		}
	},

	emits: ['closed'],

	data() {
		return {
			tab: 'req',
			reqStr: JSON5.stringify(this.req.req, null, '\t'),
			resStr: JSON5.stringify(this.req.res, null, '\t'),
		}
	},

	methods: {
	}
});
</script>

<style lang="scss" scoped>
.rlkneywz {
	display: flex;
	flex-direction: column;
	height: 100%;

	> code {
		display: block;
		flex: 1;
		padding: 8px;
		overflow: auto;
		font-size: 0.9em;
		tab-size: 2;
		white-space: pre;
	}
}
</style>

<template>
<div class="alqyeyti" :class="{ oneline }">
	<div class="key">
		<slot name="key"></slot>
	</div>
	<div class="value">
		<slot name="value"></slot>
		<button v-if="copy" v-tooltip="i18n.ts.copy" class="_textButton" style="margin-left: 0.5em;" @click="copy_"><i class="ti ti-copy"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	copy?: string | null;
	oneline?: boolean;
}>(), {
	copy: null,
	oneline: false,
});

const copy_ = () => {
	copyToClipboard(props.copy);
	os.success();
};
</script>

<style lang="scss" scoped>
.alqyeyti {
	> .key {
		font-size: 0.85em;
		padding: 0 0 0.25em 0;
		opacity: 0.75;
	}

	&.oneline {
		display: flex;

		> .key {
			width: 30%;
			font-size: 1em;
			padding: 0 8px 0 0;
		}

		> .value {
			width: 70%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}
</style>

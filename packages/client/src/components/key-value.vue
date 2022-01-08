<template>
<div class="alqyeyti" :class="{ oneline }">
	<div class="key">
		<slot name="key"></slot>
	</div>
	<div class="value">
		<slot name="value"></slot>
		<button v-if="copy" v-tooltip="$ts.copy" class="_textButton" style="margin-left: 0.5em;" @click="copy_"><i class="far fa-copy"></i></button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import * as os from '@/os';

export default defineComponent({
	props: {
		copy: {
			type: String,
			required: false,
			default: null,
		},
		oneline: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	setup(props) {
		const copy_ = () => {
			copyToClipboard(props.copy);
			os.success();
		};

		return {
			copy_
		};
	},
});
</script>

<style lang="scss" scoped>
.alqyeyti {
	> .key, > .value {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

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
		}
	}
}
</style>

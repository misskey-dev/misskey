<template>
<div class="mrdgzndn">
	<Mfm :key="text" :text="text" :is-note="false" :i="$i"/>
	<MkUrlPreview v-for="url in urls" :key="url" :url="url" class="url"/>
</div>
</template>

<script lang="ts">
import { TextBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';
import { defineAsyncComponent, defineComponent, PropType } from 'vue';
import * as mfm from 'mfm-js';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm';

export default defineComponent({
	components: {
		MkUrlPreview: defineAsyncComponent(() => import('@/components/url-preview.vue')),
	},
	props: {
		block: {
			type: Object as PropType<TextBlock>,
			required: true
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true
		}
	},
	data() {
		return {
			text: this.hpml.interpolate(this.block.text),
		};
	},
	computed: {
		urls(): string[] {
			if (this.text) {
				return extractUrlFromMfm(mfm.parse(this.text));
			} else {
				return [];
			}
		}
	},
	watch: {
		'hpml.vars': {
			handler() {
				this.text = this.hpml.interpolate(this.block.text);
			},
			deep: true
		}
	},
});
</script>

<style lang="scss" scoped>
.mrdgzndn {
	&:not(:first-child) {
		margin-top: 0.5em;
	}

	&:not(:last-child) {
		margin-bottom: 0.5em;
	}

	> .url {
		margin: 0.5em 0;
	}
}
</style>

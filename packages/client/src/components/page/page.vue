<template>
<div v-if="hpml" class="iroscrza" :class="{ center: page.alignCenter, serif: page.font === 'serif' }">
	<XBlock v-for="child in page.content" :key="child.id" :block="child" :hpml="hpml" :h="2"/>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, nextTick, onUnmounted, PropType } from 'vue';
import { parse } from '@syuilo/aiscript';
import XBlock from './page.block.vue';
import { Hpml } from '@/scripts/hpml/evaluator';
import { url } from '@/config';
import { $i } from '@/account';
import { defaultStore } from '@/store';

export default defineComponent({
	components: {
		XBlock
	},
	props: {
		page: {
			type: Object as PropType<Record<string, any>>,
			required: true
		},
	},
	setup(props, ctx) {
		const hpml = new Hpml(props.page, {
			randomSeed: Math.random(),
			visitor: $i,
			url: url,
			enableAiScript: !defaultStore.state.disablePagesScript
		});

		onMounted(() => {
			nextTick(() => {
				if (props.page.script && hpml.aiscript) {
					let ast;
					try {
						ast = parse(props.page.script);
					} catch (err) {
						console.error(err);
						/*os.alert({
							type: 'error',
							text: 'Syntax error :('
						});*/
						return;
					}
					hpml.aiscript.exec(ast).then(() => {
						hpml.eval();
					}).catch(err => {
						console.error(err);
						/*os.alert({
							type: 'error',
							text: err
						});*/
					});
				} else {
					hpml.eval();
				}
			});
			onUnmounted(() => {
				if (hpml.aiscript) hpml.aiscript.abort();
			});
		});

		return {
			hpml,
		};
	},
});
</script>

<style lang="scss" scoped>
.iroscrza {
	&.serif {
		> div {
			font-family: serif;
		}
	}

	&.center {
		text-align: center;
	}
}
</style>

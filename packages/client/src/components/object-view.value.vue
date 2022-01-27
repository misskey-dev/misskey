<template>
<div class="igpposuu _monospace">
	<div v-if="value === null" class="null">null</div>
	<div v-else-if="typeof value === 'boolean'" class="boolean">{{ value ? 'true' : 'false' }}</div>
	<div v-else-if="typeof value === 'string'" class="string">"{{ value }}"</div>
	<div v-else-if="typeof value === 'number'" class="number">{{ number(value) }}</div>
	<div v-else-if="Array.isArray(value)" class="array">
		<button @click="collapsed_ = !collapsed_">[ {{ collapsed_ ? '+' : '-' }} ]</button>
		<template v-if="!collapsed_">
			<div v-for="i in value.length" class="element">
				{{ i }}: <XValue :value="value[i - 1]" collapsed/>
			</div>
		</template>
	</div>
	<div v-else-if="typeof value === 'object'" class="object">
		<button @click="collapsed_ = !collapsed_">{ {{ collapsed_ ? '+' : '-' }} }</button>
		<template v-if="!collapsed_">
			<div v-for="k in Object.keys(value)" class="kv">
				<div class="k">{{ k }}:</div>
				<div class="v"><XValue :value="value[k]" collapsed/></div>
			</div>
		</template>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import number from '@/filters/number';

export default defineComponent({
	name: 'XValue',

	props: {
		value: {
			type: Object,
			required: true,
		},
		collapsed: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	setup(props) {
		const collapsed_ = ref(props.collapsed);

		return {
			number,
			collapsed_,
		};
	}
});
</script>

<style lang="scss" scoped>
.igpposuu {
	display: inline;

	> .null {
		display: inline;
		opacity: 0.7;
	}

	> .boolean {
		display: inline;
		color: var(--codeBoolean);
	}

	> .string {
		display: inline;
		color: var(--codeString);
	}

	> .number {
		display: inline;
		color: var(--codeNumber);
	}

	> .array {
		display: inline;

		> .element {
			display: block;
			padding-left: 16px;
		}
	}

	> .object {
		display: inline;

		> .kv {
			display: block;
			padding-left: 16px;

			> .k {
				display: inline;
				margin-right: 8px;
			}

			> .v {
				display: inline;
			}
		}
	}
}
</style>

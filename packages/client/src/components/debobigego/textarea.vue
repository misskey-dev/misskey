<template>
<FormGroup class="_debobigegoItem">
	<template #label><slot></slot></template>
	<div class="rivhosbp _debobigegoItem" :class="{ tall, pre }">
		<div class="input _debobigegoPanel">
			<textarea ref="input" v-model="v"
				:class="{ code, _monospace: code }"
				:required="required"
				:readonly="readonly"
				:pattern="pattern"
				:autocomplete="autocomplete"
				:spellcheck="!code"
				@input="onInput"
				@focus="focused = true"
				@blur="focused = false"
			></textarea>
		</div>
	</div>
	<template #caption><slot name="desc"></slot></template>

	<FormButton v-if="manualSave && changed" primary @click="updated"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
</FormGroup>
</template>

<script lang="ts">
import { defineComponent, ref, toRefs, watch } from 'vue';
import './debobigego.scss';
import FormButton from './button.vue';
import FormGroup from './group.vue';

export default defineComponent({
	components: {
		FormGroup,
		FormButton,
	},
	props: {
		modelValue: {
			required: false
		},
		required: {
			type: Boolean,
			required: false
		},
		readonly: {
			type: Boolean,
			required: false
		},
		pattern: {
			type: String,
			required: false
		},
		autocomplete: {
			type: String,
			required: false
		},
		code: {
			type: Boolean,
			required: false
		},
		tall: {
			type: Boolean,
			required: false,
			default: false
		},
		pre: {
			type: Boolean,
			required: false,
			default: false
		},
		manualSave: {
			type: Boolean,
			required: false,
			default: false
		},
	},
	setup(props, context) {
		const { modelValue } = toRefs(props);
		const v = ref(modelValue.value);
		const changed = ref(false);
		const inputEl = ref(null);
		const focus = () => inputEl.value.focus();
		const onInput = (ev) => {
			changed.value = true;
			context.emit('change', ev);
		};

		const updated = () => {
			changed.value = false;
			context.emit('update:modelValue', v.value);
		};

		watch(modelValue.value, newValue => {
			v.value = newValue;
		});

		watch(v, newValue => {
			if (!props.manualSave) {
				updated();
			}
		});
		
		return {
			v,
			updated,
			changed,
			focus,
			onInput,
		};
	}
});
</script>

<style lang="scss" scoped>
.rivhosbp {
	position: relative;

	> .input {
		position: relative;
	
		> textarea {
			display: block;
			width: 100%;
			min-width: 100%;
			max-width: 100%;
			min-height: 130px;
			margin: 0;
			padding: 16px;
			box-sizing: border-box;
			font: inherit;
			font-weight: normal;
			font-size: 1em;
			background: transparent;
			border: none;
			border-radius: 0;
			outline: none;
			box-shadow: none;
			color: var(--fg);

			&.code {
				tab-size: 2;
			}
		}
	}

	&.tall {
		> .input {
			> textarea {
				min-height: 200px;
			}
		}
	}

	&.pre {
		> .input {
			> textarea {
				white-space: pre;
			}
		}
	}
}
</style>

<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<script lang="ts">
import {computed, defineComponent, h, resolveDirective, withDirectives , ref , watch} from 'vue';
import {defaultStore} from "@/store.js";

let gaming = ref('');

const gamingMode = computed(defaultStore.makeGetterSetter('gamingMode'));
const darkMode = computed(defaultStore.makeGetterSetter('darkMode'));
if (darkMode.value && gamingMode.value == true) {
  gaming.value = 'dark';
} else if (!darkMode.value && gamingMode.value == true) {
  gaming.value = 'light';
} else {
  gaming.value = '';
}

watch(darkMode, () => {
  if (darkMode.value && gamingMode.value == true) {
    gaming.value = 'dark';
  } else if (!darkMode.value && gamingMode.value == true) {
    gaming.value = 'light';
  } else {
    gaming.value = '';
  }
})

watch(gamingMode, () => {
  if (darkMode.value && gamingMode.value == true) {
    gaming.value = 'dark';
  } else if (!darkMode.value && gamingMode.value == true) {
    gaming.value = 'light';
  } else {
    gaming.value = '';
  }
})
export default defineComponent({
	props: {
		modelValue: {
			required: true,
		},
	},
	setup(props, { emit, slots }) {
		const options = slots.default();

		return () => h('div', {
			class: 'pxhvhrfw',
		}, options.map(option => withDirectives(h('button', {
			class: ['_button', { active: props.modelValue === option.props.value , gamingDark: gaming.value == 'dark' && props.modelValue === option.props.value,gamingLight: gaming.value == 'light' && props.modelValue === option.props.value } ],
			key: option.key,
			disabled: props.modelValue === option.props.value,
			onClick: () => {
				emit('update:modelValue', option.props.value);
			},
		}, option.children), [
			[resolveDirective('click-anime')],
		])));
	},
});
</script>

<style lang="scss">
.pxhvhrfw {
	display: flex;
	font-size: 90%;

	> button {
		flex: 1;
		padding: 10px 8px;
		border-radius: 999px;

		&:disabled {
			opacity: 1 !important;
			cursor: default;
		}

		&.active {
			color: var(--accent);
			background: var(--accentedBg);

      &.gamingDark{
				color: black !important;
        background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
        background-size: 1800% 1800%;
        -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
        -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
        animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      }
      &.gamingLight{

				color:white !important;
        background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
        background-size: 1800% 1800% !important;
        -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
        -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
        animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      }
		}

		&:not(.active):hover {
			color: var(--fgHighlighted);
			background: var(--panelHighlight);
		}

		&:not(:first-child) {
			margin-left: 8px;
		}

		> .icon {
			margin-right: 6px;
		}
	}
}

@container (max-width: 500px) {
	.pxhvhrfw {
		font-size: 80%;

		> button {
			padding: 11px 8px;
		}
	}
}
@-webkit-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}  @keyframes AnimationLight {
     0% {
       background-position: 0% 50%
     }
     50% {
       background-position: 100% 50%
     }
     100% {
       background-position: 0% 50%
     }
   }
@-webkit-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
</style>

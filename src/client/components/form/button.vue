<template>
<div class="yzpgjkxe _formItem">
	<button class="main _button _formPanel _formClickable" :class="{ primary, danger }">
		<slot></slot>
	</button>
	<div class="_formCaption"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import './form.scss';

export default defineComponent({
	props: {
		primary: {
			type: Boolean,
			default: false
		},
		danger: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
});
</script>

<style lang="scss" scoped>
.yzpgjkxe {
	> .main {
		display: block;
		width: 100%;
		box-sizing: border-box;
		padding: 14px;

		&.primary {
			color: var(--accent);
		}

		&.danger {
			color: #ff2a2a;
		}
	}
}
</style>

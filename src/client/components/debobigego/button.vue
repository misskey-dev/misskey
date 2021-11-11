<template>
<div class="yzpgjkxe _debobigegoItem">
	<div class="_debobigegoLabel"><slot name="label"></slot></div>
	<button class="main _button _debobigegoPanel _debobigegoClickable" :class="{ center, primary, danger }">
		<slot></slot>
		<div class="suffix">
			<slot name="suffix"></slot>
			<div class="icon">
				<slot name="suffixIcon"></slot>
			</div>
		</div>
	</button>
	<div class="_debobigegoCaption"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import './debobigego.scss';

export default defineComponent({
	props: {
		primary: {
			type: Boolean,
			required: false,
			default: false,
		},
		danger: {
			type: Boolean,
			required: false,
			default: false,
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false,
		},
		center: {
			type: Boolean,
			required: false,
			default: true,
		}
	},
});
</script>

<style lang="scss" scoped>
.yzpgjkxe {
	> .main {
		display: flex;
		width: 100%;
		box-sizing: border-box;
		padding: 14px 16px;
		text-align: left;
		align-items: center;

		&.center {
			display: block;
			text-align: center;
		}

		&.primary {
			color: var(--accent);
		}

		&.danger {
			color: #ff2a2a;
		}

		> .suffix {
			display: inline-flex;
			margin-left: auto;
			opacity: 0.7;

			> .icon {
				margin-left: 1em;
			}
		}
	}
}
</style>

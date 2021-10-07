<template>
<div class="qmfkfnzh">
	<a class="main _button" :href="to" target="_blank" v-if="external">
		<span class="icon"><slot name="icon"></slot></span>
		<span class="text"><slot></slot></span>
	</a>
	<MkA class="main _button" :class="{ active }" :to="to" :behavior="behavior" v-else>
		<span class="icon"><slot name="icon"></slot></span>
		<span class="text"><slot></slot></span>
	</MkA>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		to: {
			type: String,
			required: true
		},
		active: {
			type: Boolean,
			required: false
		},
		external: {
			type: Boolean,
			required: false
		},
		behavior: {
			type: String,
			required: false,
		},
	},
	data() {
		return {
		};
	}
});
</script>

<style lang="scss" scoped>
.qmfkfnzh {
	> .main {
		display: flex;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		padding: 10px 16px 10px 14px;
		border-radius: 999px;
		font-size: 0.9em;

		&:hover {
			text-decoration: none;
			background: var(--panelHighlight);
		}

		&.active {
			color: var(--accent);
			background: var(--accentedBg);
		}

		> .icon {
			width: 32px;
			margin-right: 2px;
			flex-shrink: 0;
			text-align: center;
			opacity: 0.8;

			&:empty {
				display: none;

				& + .text {
					padding-left: 4px;
				}
			}
		}

		> .text {
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
			padding-right: 12px;
		}

		> .right {
			margin-left: auto;
			opacity: 0.7;

			> .text:not(:empty) {
				margin-right: 0.75em;
			}
		}
	}
}
</style>

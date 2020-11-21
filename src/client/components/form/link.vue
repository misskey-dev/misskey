<template>
<div class="qmfkfnzi _form_item">
	<MkA class="main _button _form_panel" :class="{ active }" :to="to">
		<span class="icon"><slot name="icon"></slot></span>
		<span class="text"><slot></slot></span>
		<Fa :icon="faChevronRight" class="right"/>
	</MkA>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './form.scss';

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
	},
	data() {
		return {
			faChevronRight
		};
	}
});
</script>

<style lang="scss" scoped>
.qmfkfnzi {
	> .main {
		display: flex;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		padding: 14px 16px 14px 14px;

		&:hover {
			text-decoration: none;
		}

		&.active {
			color: var(--accent);
		}

		> .icon {
			width: 32px;
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
		}
	}
}
</style>

<template>
<div class="ffcbddfc" :class="{ inline }">
	<a v-if="external" class="main _button" :href="to" target="_blank">
		<span class="icon"><slot name="icon"></slot></span>
		<span class="text"><slot></slot></span>
		<span class="right">
			<span class="text"><slot name="suffix"></slot></span>
			<i class="fas fa-external-link-alt icon"></i>
		</span>
	</a>
	<MkA v-else class="main _button" :class="{ active }" :to="to" :behavior="behavior">
		<span class="icon"><slot name="icon"></slot></span>
		<span class="text"><slot></slot></span>
		<span class="right">
			<span class="text"><slot name="suffix"></slot></span>
			<i class="fas fa-chevron-right icon"></i>
		</span>
	</MkA>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';

const props = defineProps<{
	to: string;
	active?: boolean;
	external?: boolean;
	behavior?: null | 'window' | 'browser' | 'modalWindow';
	inline?: boolean;
}>();
</script>

<style lang="scss" scoped>
.ffcbddfc {
	display: block;

	&.inline {
		display: inline-block;
	}

	> .main {
		display: flex;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		padding: 10px 14px;
		background: var(--buttonBg);
		border-radius: 6px;
		font-size: 0.9em;

		&:hover {
			text-decoration: none;
			background: var(--buttonHoverBg);
		}

		&.active {
			color: var(--accent);
			background: var(--buttonHoverBg);
		}

		> .icon {
			margin-right: 0.75em;
			flex-shrink: 0;
			text-align: center;
			color: var(--fgTransparentWeak);

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
			white-space: nowrap;

			> .text:not(:empty) {
				margin-right: 0.75em;
			}
		}
	}
}
</style>

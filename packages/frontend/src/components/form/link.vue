<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="to ? 'div' : 'button'"
	:class="[
		$style.root,
		{
			[$style.inline]: inline,
			[$style.large]: large,
			'_button': !to,
		},
	]"
>
	<component
		:is="to ? (external ? 'a' : 'MkA') : 'div'"
		:class="[$style.main, { [$style.active]: active }]"
		class="_button"
		v-bind="to ? (external ? { href: to, target: '_blank' } : { to, behavior }) : {}"
	>
		<span :class="$style.icon"><slot name="icon"></slot></span>
		<div :class="$style.headerText">
			<div>
				<MkCondensedLine :minScale="2 / 3"><slot></slot></MkCondensedLine>
			</div>
			<div v-if="$slots.caption" :class="$style.headerTextSub">
				<MkCondensedLine :minScale="2 / 3"><slot name="caption"></slot></MkCondensedLine>
			</div>
		</div>
		<span :class="$style.suffix">
			<span :class="$style.suffixText"><slot name="suffix"></slot></span>
			<i :class="to && external ? 'ti ti-external-link' : 'ti ti-chevron-right'"></i>
		</span>
	</component>
</component>
</template>

<script lang="ts" setup>
const props = defineProps<{
	to?: string;
	active?: boolean;
	external?: boolean;
	behavior?: null | 'window' | 'browser';
	inline?: boolean;
	large?: boolean;
}>();
</script>

<style lang="scss" module>
.root {
	display: block;

	&.inline {
		display: inline-block;
	}
}

.main {
	display: flex;
	align-items: center;
	width: 100%;
	box-sizing: border-box;
	padding: 10px 14px;
	background: var(--buttonBg);
	border-radius: 6px;
	font-size: 0.9em;

	&.large {
		font-size: 1em;
	}

	&:hover {
		text-decoration: none;
		background: var(--buttonHoverBg);
	}

	&.active {
		color: var(--accent);
		background: var(--buttonHoverBg);
	}
}

.icon {
	margin-right: 0.75em;
	flex-shrink: 0;
	text-align: center;
	color: var(--fgTransparentWeak);

	&:empty {
		display: none;

		& + .headerText {
			padding-left: 4px;
		}
	}
}

.headerText {
	white-space: nowrap;
	text-overflow: ellipsis;
	text-align: start;
	overflow: hidden;
	padding-right: 12px;
}

.headerTextSub {
	color: var(--fgTransparentWeak);
	font-size: .85em;
}

.suffix {
	margin-left: auto;
	opacity: 0.7;
	white-space: nowrap;

	> .suffixText:not(:empty) {
		margin-right: 0.75em;
	}
}
</style>

<template>
<div class="dwzlatin" :class="{ opened }">
	<div class="header _button" @click="toggle">
		<span class="icon"><slot name="icon"></slot></span>
		<span class="text"><slot name="label"></slot></span>
		<span class="right">
			<span class="text"><slot name="suffix"></slot></span>
			<i v-if="opened" class="ti ti-chevron-up icon"></i>
			<i v-else class="ti ti-chevron-down icon"></i>
		</span>
	</div>
	<div v-if="openedAtLeastOnce" class="body">
		<Transition
			:name="$store.state.animation ? 'folder-toggle' : ''"
			@enter="enter"
			@after-enter="afterEnter"
			@leave="leave"
			@after-leave="afterLeave"
		>
			<KeepAlive>
				<div v-show="opened">
					<MkSpacer :margin-min="14" :margin-max="22">
						<slot></slot>
					</MkSpacer>
				</div>
			</KeepAlive>
		</Transition>
	</div>
</div>
</template>

<script lang="ts" setup>
import { nextTick } from 'vue';

const props = withDefaults(defineProps<{
	defaultOpen: boolean;
}>(), {
	defaultOpen: false,
});

let opened = $ref(props.defaultOpen);
let openedAtLeastOnce = $ref(props.defaultOpen);

function enter(el) {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = 0;
	el.offsetHeight; // reflow
	el.style.height = elementHeight + 'px';
}

function afterEnter(el) {
	el.style.height = null;
}

function leave(el) {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = elementHeight + 'px';
	el.offsetHeight; // reflow
	el.style.height = 0;
}

function afterLeave(el) {
	el.style.height = null;
}

function toggle() {
	if (!opened) {
		openedAtLeastOnce = true;
	}

	nextTick(() => {
		opened = !opened;
	});
}
</script>

<style lang="scss" scoped>
.folder-toggle-enter-active, .folder-toggle-leave-active {
	overflow-y: clip;
	transition: opacity 0.3s, height 0.3s, transform 0.3s !important;
}
.folder-toggle-enter-from, .folder-toggle-leave-to {
	opacity: 0;
}

.dwzlatin {
	display: block;

	> .header {
		display: flex;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		padding: 10px 14px 10px 14px;
		background: var(--buttonBg);
		border-radius: 6px;

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
			white-space: nowrap;

			> .text:not(:empty) {
				margin-right: 0.75em;
			}
		}
	}

	> .body {
		background: var(--panel);
		border-radius: 0 0 6px 6px;
		container-type: inline-size;
	}

	&.opened {
		> .header {
			border-radius: 6px 6px 0 0;
		}
	}
}
</style>

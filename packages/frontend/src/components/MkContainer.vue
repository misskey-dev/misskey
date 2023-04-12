<template>
<div class="_panel" :class="[$style.root, { [$style.naked]: naked, [$style.thin]: thin, [$style.hideHeader]: !showHeader, [$style.scrollable]: scrollable, [$style.closed]: !showBody }]">
	<header v-if="showHeader" ref="header" :class="$style.header">
		<div :class="$style.title">
			<span :class="$style.titleIcon"><slot name="icon"></slot></span>
			<slot name="header"></slot>
		</div>
		<div :class="$style.headerSub">
			<slot name="func" :button-style-class="$style.headerButton"></slot>
			<button v-if="foldable" :class="$style.headerButton" class="_button" @click="() => showBody = !showBody">
				<template v-if="showBody"><i class="ti ti-chevron-up"></i></template>
				<template v-else><i class="ti ti-chevron-down"></i></template>
			</button>
		</div>
	</header>
	<Transition
		:enter-active-class="defaultStore.state.animation ? $style.transition_toggle_enterActive : ''"
		:leave-active-class="defaultStore.state.animation ? $style.transition_toggle_leaveActive : ''"
		:enter-from-class="defaultStore.state.animation ? $style.transition_toggle_enterFrom : ''"
		:leave-to-class="defaultStore.state.animation ? $style.transition_toggle_leaveTo : ''"
		@enter="enter"
		@after-enter="afterEnter"
		@leave="leave"
		@after-leave="afterLeave"
	>
		<div v-show="showBody" ref="content" :class="[$style.content, { [$style.omitted]: omitted }]">
			<slot></slot>
			<button v-if="omitted" :class="$style.fade" class="_button" @click="() => { ignoreOmit = true; omitted = false; }">
				<span :class="$style.fadeLabel">{{ i18n.ts.showMore }}</span>
			</button>
		</div>
	</Transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			required: false,
			default: true,
		},
		thin: {
			type: Boolean,
			required: false,
			default: false,
		},
		naked: {
			type: Boolean,
			required: false,
			default: false,
		},
		foldable: {
			type: Boolean,
			required: false,
			default: false,
		},
		expanded: {
			type: Boolean,
			required: false,
			default: true,
		},
		scrollable: {
			type: Boolean,
			required: false,
			default: false,
		},
		maxHeight: {
			type: Number,
			required: false,
			default: null,
		},
	},
	data() {
		return {
			showBody: this.expanded,
			omitted: null,
			ignoreOmit: false,
			defaultStore,
			i18n,
		};
	},
	mounted() {
		this.$watch('showBody', showBody => {
			const headerHeight = this.showHeader ? this.$refs.header.offsetHeight : 0;
			this.$el.style.minHeight = `${headerHeight}px`;
			if (showBody) {
				this.$el.style.flexBasis = 'auto';
			} else {
				this.$el.style.flexBasis = `${headerHeight}px`;
			}
		}, {
			immediate: true,
		});

		this.$el.style.setProperty('--maxHeight', this.maxHeight + 'px');

		const calcOmit = () => {
			if (this.omitted || this.ignoreOmit || this.maxHeight == null) return;
			const height = this.$refs.content.offsetHeight;
			this.omitted = height > this.maxHeight;
		};

		calcOmit();
		new ResizeObserver((entries, observer) => {
			calcOmit();
		}).observe(this.$refs.content);
	},
	methods: {
		toggleContent(show: boolean) {
			if (!this.foldable) return;
			this.showBody = show;
		},

		enter(el) {
			const elementHeight = el.getBoundingClientRect().height;
			el.style.height = 0;
			el.offsetHeight; // reflow
			el.style.height = elementHeight + 'px';
		},
		afterEnter(el) {
			el.style.height = null;
		},
		leave(el) {
			const elementHeight = el.getBoundingClientRect().height;
			el.style.height = elementHeight + 'px';
			el.offsetHeight; // reflow
			el.style.height = 0;
		},
		afterLeave(el) {
			el.style.height = null;
		},
	},
});
</script>

<style lang="scss" module>
.transition_toggle_enterActive,
.transition_toggle_leaveActive {
	overflow-y: clip;
	transition: opacity 0.5s, height 0.5s !important;
}
.transition_toggle_enterFrom,
.transition_toggle_leaveTo {
	opacity: 0;
}

.root {
	position: relative;
	overflow: clip;
	contain: content;

	&.naked {
		background: transparent !important;
		box-shadow: none !important;
	}

	&.scrollable {
		display: flex;
		flex-direction: column;

		> .content {
			overflow: auto;
		}
	}

	&.thin {
		> .header {
			> .title {
				padding: 8px 10px;
				font-size: 0.9em;
			}
		}
	}
}

.header {
	position: sticky;
	top: var(--stickyTop, 0px);
	left: 0;
	color: var(--panelHeaderFg);
	background: var(--panelHeaderBg);
	border-bottom: solid 0.5px var(--panelHeaderDivider);
	z-index: 2;
	line-height: 1.4em;
}

.title {
	margin: 0;
	padding: 12px 16px;

	&:empty {
		display: none;
	}
}

.titleIcon {
	margin-right: 6px;
}

.headerSub {
	position: absolute;
	z-index: 2;
	top: 0;
	right: 0;
	height: 100%;
}

.headerButton {
	width: 42px;
	height: 100%;
}

.content {
	--stickyTop: 0px;

	&.omitted {
		position: relative;
		max-height: var(--maxHeight);
		overflow: hidden;

		> .fade {
			display: block;
			position: absolute;
			z-index: 10;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--panel), var(--X15));

			> .fadeLabel {
				display: inline-block;
				background: var(--panel);
				padding: 6px 10px;
				font-size: 0.8em;
				border-radius: 999px;
				box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
			}

			&:hover {
				> .fadeLabel {
					background: var(--panelHighlight);
				}
			}
		}
	}
}

@container (max-width: 380px) {
	.title {
		padding: 8px 10px;
		font-size: 0.9em;
	}
}
</style>

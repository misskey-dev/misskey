<template>
<div class="ukygtjoj _block" :class="{ naked, hideHeader: !showHeader, scrollable, closed: !showBody }" v-size="{ max: [380] }">
	<header v-if="showHeader" ref="header">
		<div class="title"><slot name="header"></slot></div>
		<div class="sub">
			<slot name="func"></slot>
			<button class="_button" v-if="foldable" @click="() => showBody = !showBody">
				<template v-if="showBody"><Fa :icon="faAngleUp"/></template>
				<template v-else><Fa :icon="faAngleDown"/></template>
			</button>
		</div>
	</header>
	<transition name="container-toggle"
		@enter="enter"
		@after-enter="afterEnter"
		@leave="leave"
		@after-leave="afterLeave"
	>
		<div v-show="showBody" class="content" :class="{ omitted }" ref="content">
			<slot></slot>
			<button v-if="omitted" class="fade _button" @click="() => { ignoreOmit = true; omitted = false; }">
				<span>{{ $ts.showMore }}</span>
			</button>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';

export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			required: false,
			default: true
		},
		naked: {
			type: Boolean,
			required: false,
			default: false
		},
		foldable: {
			type: Boolean,
			required: false,
			default: false
		},
		expanded: {
			type: Boolean,
			required: false,
			default: true
		},
		scrollable: {
			type: Boolean,
			required: false,
			default: false
		},
		maxHeight: {
			type: Number,
			required: false,
			default: null
		},
	},
	data() {
		return {
			showBody: this.expanded,
			omitted: null,
			ignoreOmit: false,
			faAngleUp, faAngleDown
		};
	},
	mounted() {
		this.$watch('showBody', showBody => {
			const headerHeight = this.showHeader ? this.$refs.header.offsetHeight : 0;
			this.$el.style.minHeight = `${headerHeight}px`;
			if (showBody) {
				this.$el.style.flexBasis = `auto`;
			} else {
				this.$el.style.flexBasis = `${headerHeight}px`;
			}
		}, {
			immediate: true
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
	}
});
</script>

<style lang="scss" scoped>
.container-toggle-enter-active, .container-toggle-leave-active {
	overflow-y: hidden;
	transition: opacity 0.5s, height 0.5s !important;
}
.container-toggle-enter-from {
	opacity: 0;
}
.container-toggle-leave-to {
	opacity: 0;
}

.ukygtjoj {
	position: relative;
	overflow: clip;

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

	> header {
		position: sticky;
		top: var(--stickyTop, 0px);
		left: 0;
		color: var(--panelHeaderFg);
		background: var(--panelHeaderBg);
		border-bottom: solid 0.5px var(--panelHeaderDivider);
		z-index: 2;
		line-height: 1.4em;

		> .title {
			margin: 0;
			padding: 12px 16px;

			> ::v-deep([data-icon]) {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .sub {
			position: absolute;
			z-index: 2;
			top: 0;
			right: 0;
			height: 100%;

			> ::v-deep(button) {
				width: 42px;
				height: 100%;
			}
		}
	}

	> .content {
		&.omitted {
			position: relative;
			max-height: var(--maxHeight);
			overflow: hidden;

			> .fade {
				display: block;
				position: absolute;
				bottom: 0;
				left: 0;
				width: 100%;
				height: 64px;
				background: linear-gradient(0deg, var(--panel), var(--X15));

				> span {
					display: inline-block;
					background: var(--panel);
					padding: 6px 10px;
					font-size: 0.8em;
					border-radius: 999px;
					box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
				}

				&:hover {
					> span {
						background: var(--panelHighlight);
					}
				}
			}
		}
	}

	&.max-width_380px {
		> header {
			> .title {
				padding: 8px 10px;
				font-size: 0.9em;
			}
		}

		> .content {
		}
	}
}

._forceContainerFull_ .ukygtjoj {
	> header {
		> .title {
			padding: 12px 16px !important;
		}
	}
}

._forceContainerFull_.ukygtjoj {
	> header {
		> .title {
			padding: 12px 16px !important;
		}
	}
}
</style>

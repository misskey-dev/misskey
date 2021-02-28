<template>
<MkModal ref="modal" :manual-showing="manualShowing" :src="src" @click="$refs.modal.close()" @opening="opening" @close="$emit('close')" @closed="$emit('closed')">
	<MkEmojiPicker :show-pinned="showPinned" :as-reaction-picker="asReactionPicker" @chosen="chosen" ref="picker"/>
</MkModal>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import MkModal from '@/components/ui/modal.vue';
import MkEmojiPicker from '@/components/emoji-picker.vue';

export default defineComponent({
	components: {
		MkModal,
		MkEmojiPicker,
	},

	props: {
		manualShowing: {
			type: Boolean,
			required: false,
			default: null,
		},
		src: {
			required: false
		},
		showPinned: {
			required: false,
			default: true
		},
		asReactionPicker: {
			required: false
		},
	},

	emits: ['done', 'closed'],

	data() {
		return {

		};
	},

	methods: {
		chosen(emoji: any) {
			this.$emit('done', emoji);
			this.$refs.modal.close();
		},

		opening() {
			this.$refs.picker.reset();
			this.$refs.picker.focus();
		}
	}
});
</script>

<style lang="scss" scoped>
.omfetrab {
	$pad: 8px;
	--eachSize: 40px;

	display: flex;
	flex-direction: column;
	contain: content;

	&.big {
		--eachSize: 44px;
	}

	&.w1 {
		width: calc((var(--eachSize) * 5) + (#{$pad} * 2));
	}

	&.w2 {
		width: calc((var(--eachSize) * 6) + (#{$pad} * 2));
	}

	&.w3 {
		width: calc((var(--eachSize) * 7) + (#{$pad} * 2));
	}

	&.h1 {
		--height: calc((var(--eachSize) * 4) + (#{$pad} * 2));
	}

	&.h2 {
		--height: calc((var(--eachSize) * 6) + (#{$pad} * 2));
	}

	&.h3 {
		--height: calc((var(--eachSize) * 8) + (#{$pad} * 2));
	}

	> .search {
		width: 100%;
		padding: 12px;
		box-sizing: border-box;
		font-size: 1em;
		outline: none;
		border: none;
		background: transparent;
		color: var(--fg);

		&:not(.filled) {
			order: 1;
			z-index: 2;
			box-shadow: 0px -1px 0 0px var(--divider);
		}
	}

	> .emojis {
		height: var(--height);
		overflow-y: auto;
		overflow-x: hidden;

		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}

		> .index {
			min-height: var(--height);
			position: relative;
			border-bottom: solid 1px var(--divider);
				
			> .arrow {
				position: absolute;
				bottom: 0;
				left: 0;
				width: 100%;
				padding: 16px 0;
				text-align: center;
				opacity: 0.5;
				pointer-events: none;
			}
		}

		section {
			> header {
				position: sticky;
				top: 0;
				left: 0;
				z-index: 1;
				padding: 8px;
				font-size: 12px;
			}

			> div {
				padding: $pad;

				> button {
					position: relative;
					padding: 0;
					width: var(--eachSize);
					height: var(--eachSize);
					border-radius: 4px;

					&:focus {
						outline: solid 2px var(--focus);
						z-index: 1;
					}

					&:hover {
						background: rgba(0, 0, 0, 0.05);
					}

					&:active {
						background: var(--accent);
						box-shadow: inset 0 0.15em 0.3em rgba(27, 31, 35, 0.15);
					}

					> * {
						font-size: 24px;
						height: 1.25em;
						vertical-align: -.25em;
						pointer-events: none;
					}
				}
			}

			&.result {
				border-bottom: solid 1px var(--divider);

				&:empty {
					display: none;
				}
			}

			&.unicode {
				min-height: 384px;
			}

			&.custom {
				min-height: 64px;
			}
		}
	}
}
</style>

<template>
<button
	v-if="count > 0"
	ref="buttonRef"
	v-particle="canToggle"
	class="hkzvhatu _button"
	:class="{ reacted: note.myReaction == reaction, canToggle }"
	@click="toggleReaction()"
	@touchstart.passive="onMouseover"
	@mouseover="onMouseover"
	@mouseleave="onMouseleave"
	@touchend="onMouseleave"
>
	<XReactionIcon :reaction="reaction" :custom-emojis="note.emojis"/>
	<span>{{ count }}</span>
</button>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import XDetails from '@/components/reactions-viewer.details.vue';
import XReactionIcon from '@/components/reaction-icon.vue';
import * as os from '@/os';
import { useTooltip } from '@/scripts/use-tooltip';
import { $i } from '@/account';

export default defineComponent({
	components: {
		XReactionIcon
	},

	props: {
		reaction: {
			type: String,
			required: true,
		},
		count: {
			type: Number,
			required: true,
		},
		isInitial: {
			type: Boolean,
			required: true,
		},
		note: {
			type: Object,
			required: true,
		},
	},

	setup(props) {
		const buttonRef = ref<HTMLElement>();

		const canToggle = computed(() => !props.reaction.match(/@\w/) && $i);

		const toggleReaction = () => {
			if (!canToggle.value) return;

			const oldReaction = props.note.myReaction;
			if (oldReaction) {
				os.api('notes/reactions/delete', {
					noteId: props.note.id
				}).then(() => {
					if (oldReaction !== props.reaction) {
						os.api('notes/reactions/create', {
							noteId: props.note.id,
							reaction: props.reaction
						});
					}
				});
			} else {
				os.api('notes/reactions/create', {
					noteId: props.note.id,
					reaction: props.reaction
				});
			}
		};

		const anime = () => {
			if (document.hidden) return;

			// TODO: 新しくリアクションが付いたことが視覚的に分かりやすいアニメーション
		};

		watch(() => props.count, (newCount, oldCount) => {
			if (oldCount < newCount) anime();
		});

		onMounted(() => {
			if (!props.isInitial) anime();
		});

		const { onMouseover, onMouseleave } = useTooltip(async (showing) => {
			const reactions = await os.api('notes/reactions', {
				noteId: props.note.id,
				type: props.reaction,
				limit: 11
			});

			const users = reactions
				.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
				.map(x => x.user);

			os.popup(XDetails, {
				showing,
				reaction: props.reaction,
				emojis: props.note.emojis,
				users,
				count: props.count,
				source: buttonRef.value
			}, {}, 'closed');
		});

		return {
			buttonRef,
			canToggle,
			toggleReaction,
			onMouseover,
			onMouseleave,
		};
	},
});
</script>

<style lang="scss" scoped>
.hkzvhatu {
	display: inline-block;
	height: 32px;
	margin: 2px;
	padding: 0 6px;
	border-radius: 4px;

	&.canToggle {
		background: rgba(0, 0, 0, 0.05);

		&:hover {
			background: rgba(0, 0, 0, 0.1);
		}
	}

	&:not(.canToggle) {
		cursor: default;
	}

	&.reacted {
		background: var(--accent);

		&:hover {
			background: var(--accent);
		}

		> span {
			color: var(--fgOnAccent);
		}
	}

	> span {
		font-size: 0.9em;
		line-height: 32px;
		margin: 0 0 0 4px;
	}
}
</style>

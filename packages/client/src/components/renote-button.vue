<template>
<button v-if="canRenote"
	ref="buttonRef"
	class="eddddedb _button canRenote"
	@click="renote()"
	@touchstart.passive="onMouseover"
	@mouseover="onMouseover"
	@mouseleave="onMouseleave"
	@touchend="onMouseleave"
>
	<i class="fas fa-retweet"></i>
	<p v-if="count > 0" class="count">{{ count }}</p>
</button>
<button v-else class="eddddedb _button">
	<i class="fas fa-ban"></i>
</button>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import XDetails from '@/components/renote.details.vue';
import { pleaseLogin } from '@/scripts/please-login';
import * as os from '@/os';
import { $i } from '@/account';
import { useTooltip } from '@/scripts/use-tooltip';
import { i18n } from '@/i18n';

export default defineComponent({
	props: {
		count: {
			type: Number,
			required: true,
		},
		note: {
			type: Object,
			required: true,
		},
	},

	setup(props) {
		const buttonRef = ref<HTMLElement>();

		const canRenote = computed(() => ['public', 'home'].includes(props.note.visibility) || props.note.userId === $i.id);

		const { onMouseover, onMouseleave } = useTooltip(async (showing) => {
			const renotes = await os.api('notes/renotes', {
				noteId: props.note.id,
				limit: 11
			});

			const users = renotes.map(x => x.user);

			if (users.length < 1) return;

			os.popup(XDetails, {
				showing,
				users,
				count: props.count,
				source: buttonRef.value
			}, {}, 'closed');
		});

		const renote = (viaKeyboard = false) => {
			pleaseLogin();
			os.popupMenu([{
				text: i18n.locale.renote,
				icon: 'fas fa-retweet',
				action: () => {
					os.api('notes/create', {
						renoteId: props.note.id
					});
				}
			}, {
				text: i18n.locale.quote,
				icon: 'fas fa-quote-right',
				action: () => {
					os.post({
						renote: props.note,
					});
				}
			}], buttonRef.value, {
				viaKeyboard
			});
		};

		return {
			buttonRef,
			canRenote,
			renote,
			onMouseover,
			onMouseleave,
		};
	},
});
</script>

<style lang="scss" scoped>
.eddddedb {
	display: inline-block;
	height: 32px;
	margin: 2px;
	padding: 0 6px;
	border-radius: 4px;

	&:not(.canRenote) {
		cursor: default;
	}

	&.renoted {
		background: var(--accent);
	}

	> .count {
		display: inline;
		margin-left: 8px;
		opacity: 0.7;
	}
}
</style>

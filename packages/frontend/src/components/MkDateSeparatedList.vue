<script lang="ts">
import { defineComponent, h, PropType, TransitionGroup, useCssModule } from 'vue';
import MkAd from '@/components/global/MkAd.vue';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';
import { MisskeyEntity } from '@/types/date-separated-list';

export default defineComponent({
	props: {
		items: {
			type: Array as PropType<MisskeyEntity[]>,
			required: true,
		},
		direction: {
			type: String,
			required: false,
			default: 'down',
		},
		reversed: {
			type: Boolean,
			required: false,
			default: false,
		},
		noGap: {
			type: Boolean,
			required: false,
			default: false,
		},
		ad: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	setup(props, { slots, expose }) {
		const $style = useCssModule();
		function getDateText(time: string) {
			const date = new Date(time).getDate();
			const month = new Date(time).getMonth() + 1;
			return i18n.t('monthAndDay', {
				month: month.toString(),
				day: date.toString(),
			});
		}

		if (props.items.length === 0) return;

		const renderChildren = () => props.items.map((item, i) => {
			if (!slots || !slots.default) return;

			const el = slots.default({
				item: item,
			})[0];
			if (el.key == null && item.id) el.key = item.id;

			if (
				i !== props.items.length - 1 &&
				new Date(item.createdAt).getDate() !== new Date(props.items[i + 1].createdAt).getDate()
			) {
				const separator = h('div', {
					class: $style.separator,
					key: item.id + ':separator',
				}, h('p', {
					class: $style.date,
				}, [
					h('span', {
						class: (i === 0 || i === props.items.length - 1) ? $style.dateItemMargin : undefined,
					}, [
						h('i', {
							class: `ti ti-chevron-up icon${(i === 0 || i === props.items.length - 1) ? ` ${$style.dateItemMarginIcon}` : ''}`,
						}),
						getDateText(item.createdAt),
					]),
					h('span', [
						getDateText(props.items[i + 1].createdAt),
						h('i', {
							class: 'ti ti-chevron-down icon',
						}),
					]),
				]));

				return [el, separator];
			} else {
				if (props.ad && item._shouldInsertAd_) {
					return [h(MkAd, {
						key: item.id + ':ad',
						prefer: ['horizontal', 'horizontal-big'],
					}), el];
				} else {
					return el;
				}
			}
		});

		function onBeforeLeave(el: HTMLElement) {
			el.style.top = `${el.offsetTop}px`;
			el.style.left = `${el.offsetLeft}px`;
		}
		function onLeaveCanceled(el: HTMLElement) {
			el.style.top = '';
			el.style.left = '';
		}

		return () => h(
			defaultStore.state.animation ? TransitionGroup : 'div',
			{
					class: {
						'sqadhkmv': true,
						'noGap': props.noGap
					},
					'data-direction': props.direction,
					'data-reversed': props.reversed ? 'true' : 'false',
					...(defaultStore.state.animation ? {
						name: 'list',
						tag: 'div',
						onBeforeLeave,
						onLeaveCanceled,
					} : {}),
			},
			{ default: renderChildren });
	},
});
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;

	&:global {
	> .list-move {
		transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
	}

	&.deny-move-transition > .list-move {
		transition: none !important;
	}

	> .list-leave-active,
	> .list-enter-active {
		transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1);
	}

	> .list-leave-from,
	> .list-leave-to,
	> .list-leave-active {
		transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1);
		position: absolute !important;
	}

	&[data-direction="up"] {
		> .list-enter-from,
		> .list-leave-to {
			opacity: 0;
			transform: translateY(64px);
		}
	}
	}

	> *:empty {
		display: none;
	}

	> *:not(:last-child) {
		margin-bottom: var(--margin);
	}


	&[data-direction="down"] {
		> .list-enter-from,
		> .list-leave-to {
			opacity: 0;
			transform: translateY(-64px);
		}
	}

	&[data-reversed="true"] {
		display: flex;
		flex-direction: column-reverse;
	}

	&.noGap {
		> * {
			margin: 0 !important;
			border: none;
			border-radius: 0;
			box-shadow: none;

			&:not(:last-child) {
				border-bottom: solid 0.5px var(--divider);
			}
		}
	}
}

.separator {
	text-align: center;
}

.date {
	display: inline-block;
	position: relative;
	margin: 0;
	padding: 0 16px;
	line-height: 32px;
	text-align: center;
	font-size: 12px;
	color: var(--dateLabelFg);
}

.date-item-margin {
	margin-right: 8px;
}

.date-item-margin-icon {
	margin-right: 8px;
}
</style>


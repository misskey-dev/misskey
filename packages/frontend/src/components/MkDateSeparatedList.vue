<script lang="ts">
import { defineComponent, h, PropType, TransitionGroup, useCssModule } from 'vue';
import MkAd from '@/components/global/MkAd.vue';
import { isDebuggerEnabled, stackTraceInstances } from '@/debug';
import { i18n } from '@/i18n';
import * as os from '@/os';
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
		otherServer: {
			type: Boolean,
			required: false,
			default: false,
		},
		otherDomain: {
			type: String,
			required: false,
			default: '',
		},
		otherProtocol: {
			type: String,
			required: false,
			default: '',
		},
		emojis: {
			type: Object,
			required: false,
			default: undefined,
		},
		meta: {
			type: Object,
			required: false,
			default: undefined,	
		}
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

		const renderChildrenImpl = () => props.items.map((item, i) => {
			if (!slots || !slots.default) return;

			function getEmoji( emojiName: string ): string {
				let emojiUrl = `${props.otherProtocol}://${props.otherDomain}/emoji/${emojiName}.webp`;
				if (props.emojis != null) {
					let emojiData = props.emojis.find((emoji) => {
						return emoji.name === emojiName;
					});
					if (emojiData !== null && emojiData !== undefined) {
						emojiUrl = emojiData.url;
					}
				}
				return emojiUrl;
			};
			
			if (props.otherServer) {
				if (item.user.host !== props.otherDomain) {
					// 入れられたリアクションのドメインを修正
					if (item.reactions != null) {
						let reactions = {};
						let reactinUrl = item.reactionEmojis;
						for (let key in item.reactions) {
							if (key.indexOf('@.') !== -1) {
								let newkey = key.replace('@.', `@${props.otherDomain}`);
								reactions[newkey] = item.reactions[key];

								// 置き換えたURLを設定
								let emojiName = newkey.substr(1, newkey.length - 2).split('@')[0];
								reactinUrl[newkey.substr(1, newkey.length - 2)] = getEmoji(emojiName);
							} else {
								reactions[key] = item.reactions[key];
							}
						}
						item.reactions = reactions;
						item.reactionEmojis = reactinUrl;
					}

					// カスタム絵文字を置き換える
					if (item.text != null && item.emojis == null) {
						if (item.text != null)
						{
							const m = item.text.match(/:.*?:/g);
							let emojis = {};
							if (m != null) {
								m.forEach((emoji) => {
									const emojiName = emoji.substr(1, emoji.length - 2);
									emojis[emojiName] = getEmoji(emojiName);
								});

								item.emojis = emojis;
							}
						}

						// ユーザー絵文字を適応
						if (item.user.name != null)
						{
							const m = item.user.name.match(/:.*?:/g);
							let emojis = {};
							if (m != null) {
								m.forEach((emoji) => {
									const emojiName = emoji.substr(1, emoji.length - 2);
									emojis[emojiName] = getEmoji(emojiName);
								});
								item.user.emojis = emojis;
							}							
						}
					}
					if (item.renote != null) {
						if (item.renote.text != null && item.renote.emojis == null) {
							if (item.renote.text != null)
							{
								const m = item.renote.text.match(/:.*?:/g);
								let emojis = {};
								if (m != null) {
									m.forEach((emoji) => {
										const emojiName = emoji.substr(1, emoji.length - 2);
										emojis[emojiName] = getEmoji(emojiName);
									});

									item.renote.emojis = emojis;
								}
							}
							
							// ユーザー絵文字を適応
							if (item.renote.user.name != null)
							{
								const m = item.renote.user.name.match(/:.*?:/g);
								let emojis = {};
								if (m != null) {
									m.forEach((emoji) => {
										const emojiName = emoji.substr(1, emoji.length - 2);
										emojis[emojiName] = getEmoji(emojiName);
									});
									item.renote.user.emojis = emojis;
								}							
							}
						}
						
						// 入れられたリアクションのドメインを修正
						if (item.renote.reactions != null) {
							let reactions = {};
							let reactinUrl = item.renote.reactionEmojis;
							for (let key in item.renote.reactions) {
								if (key.indexOf('@.') !== -1) {
									let newkey = key.replace('@.', `@${props.otherDomain}`);
									reactions[newkey] = item.renote.reactions[key];
									// 置き換えたURLを設定
									let emojiName = newkey.substr(1, newkey.length - 2).split('@')[0];
									reactinUrl[newkey.substr(1, newkey.length - 2)] = getEmoji(emojiName);
								} else {
									reactions[key] = item.renote.reactions[key];
								}
							}
							item.renote.reactions = reactions;
							item.renote.reactionEmojis = reactinUrl;
						}
					}
				}

				item.localOnly = false;
				item.otherServer = true;
				item.otherDomain = props.otherDomain;
				item.otherProtocol = props.otherProtocol;
				item.url = `${props.otherProtocol}://${props.otherDomain}/notes/${item.id}`;
				item.user.host = props.otherDomain;

				if (item.renoteId != null) {
					item.renote.otherServer = true;
					if ( item.renote.uri == null) {
						item.renote.uri = `${props.otherProtocol}://${props.otherDomain}/notes/${item.renoteId}`;
					}

					item.renote.user.host = item.renote.uri.split('://')[1].split('/')[0];
				}
			}

			const el = slots.default({
				item: item,
			})[0];
			if (el.key == null && item.id) el.key = item.id;

			if (
				i !== props.items.length - 1 &&
				new Date(item.createdAt).getDate() !== new Date(props.items[i + 1].createdAt).getDate()
			) {
				const separator = h('div', {
					class: $style['separator'],
					key: item.id + ':separator',
				}, h('p', {
					class: $style['date'],
				}, [
					h('span', {
						class: $style['date-1'],
					}, [
						h('i', {
							class: `ti ti-chevron-up ${$style['date-1-icon']}`,
						}),
						getDateText(item.createdAt),
					]),
					h('span', {
						class: $style['date-2'],
					}, [
						getDateText(props.items[i + 1].createdAt),
						h('i', {
							class: `ti ti-chevron-down ${$style['date-2-icon']}`,
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

		const renderChildren = () => {
			const children = renderChildrenImpl();
			if (isDebuggerEnabled(6864)) {
				const nodes = children.flatMap((node) => node ?? []);
				const keys = new Set(nodes.map((node) => node.key));
				if (keys.size !== nodes.length) {
					const id = crypto.randomUUID();
					const instances = stackTraceInstances();
					os.toast(instances.reduce((a, c) => `${a} at ${c.type.name}`, `[DEBUG_6864 (${id})]: ${nodes.length - keys.size} duplicated keys found`));
					console.warn({ id, debugId: 6864, stack: instances });
				}
			}
			return children;
		};

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
					[$style['date-separated-list']]: true,
					[$style['date-separated-list-nogap']]: props.noGap,
					[$style['reversed']]: props.reversed,
					[$style['direction-down']]: props.direction === 'down',
					[$style['direction-up']]: props.direction === 'up',
				},
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
.date-separated-list {
	container-type: inline-size;

	&:global {
	> .list-move {
		transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
	}

	&.deny-move-transition > .list-move {
		transition: none !important;
	}

	> .list-enter-active {
		transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1);
	}

	> *:empty {
		display: none;
	}

	> *:not(:last-child) {
		margin-bottom: var(--margin);
	}
	}
}

.date-separated-list-nogap {
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

.direction-up {
	&:global {
	> .list-enter-from,
	> .list-leave-to {
		opacity: 0;
		transform: translateY(64px);
	}
	}
}
.direction-down {
	&:global {
	> .list-enter-from,
	> .list-leave-to {
		opacity: 0;
		transform: translateY(-64px);
	}
	}
}

.reversed {
	display: flex;
	flex-direction: column-reverse;
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

.date-1 {
	margin-right: 8px;
}

.date-1-icon {
	margin-right: 8px;
}

.date-2 {
	margin-left: 8px;
}

.date-2-icon {
	margin-left: 8px;
}
</style>


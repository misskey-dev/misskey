<script lang="ts">
import { defineComponent, h, TransitionGroup } from 'vue';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
	props: {
		items: {
			type: Array,
			required: true,
		},
		direction: {
			type: String,
			required: false,
			default: 'down'
		},
		reversed: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	methods: {
		focus() {
			this.$slots.default[0].elm.focus();
		},

		getDateText(time: string) {
			const date = new Date(time).getDate();
			const month = new Date(time).getMonth() + 1;
			return this.$t('monthAndDay', {
				month: month.toString(),
				day: date.toString()
			});
		}
	},

	render() {
		const noGap = [...document.querySelectorAll('._noGap_')].some(el => el.contains(this.$parent.$el));

		if (this.items.length === 0) return;

		return h(this.$store.state.animation ? TransitionGroup : 'div', this.$store.state.animation ? {
			class: 'sqadhkmv' + (noGap ? ' _block' : ''),
			name: 'list',
			tag: 'div',
			'data-direction': this.direction,
			'data-reversed': this.reversed ? 'true' : 'false',
		} : {
			class: 'sqadhkmv',
		}, this.items.map((item, i) => {
			const el = this.$slots.default({
				item: item
			})[0];
			if (el.key == null && item.id) el.key = item.id;

			if (
				i != this.items.length - 1 &&
				new Date(item.createdAt).getDate() != new Date(this.items[i + 1].createdAt).getDate() &&
				!item._prId_ &&
				!this.items[i + 1]._prId_ &&
				!item._featuredId_ &&
				!this.items[i + 1]._featuredId_
			) {
				const separator = h('div', {
					class: 'separator',
					key: item.id + ':separator',
				}, h('p', {
					class: 'date'
				}, [
					h('span', [
						h(FontAwesomeIcon, {
							class: 'icon',
							icon: faAngleUp,
						}),
						this.getDateText(item.createdAt)
					]),
					h('span', [
						this.getDateText(this.items[i + 1].createdAt),
						h(FontAwesomeIcon, {
							class: 'icon',
							icon: faAngleDown,
						})
					])
				]));

				return [el, separator];
			} else {
				return el;
			}
		}));
	},
});
</script>

<style lang="scss">
.sqadhkmv {
	> *:not(:last-child) {
		margin-bottom: var(--margin);
	}

	> .list-move {
		transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
	}

	> .list-enter-active {
		transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1);
	}

	&[data-direction="up"] {
		> .list-enter-from {
			opacity: 0;
			transform: translateY(64px);
		}
	}

	&[data-direction="down"] {
		> .list-enter-from {
			opacity: 0;
			transform: translateY(-64px);
		}
	}

	> .separator {
		text-align: center;

		> .date {
			display: inline-block;
			position: relative;
			margin: 0;
			padding: 0 16px;
			line-height: 32px;
			text-align: center;
			font-size: 12px;
			color: var(--dateLabelFg);

			> span {
				&:first-child {
					margin-right: 8px;

					> .icon {
						margin-right: 8px;
					}
				}

				&:last-child {
					margin-left: 8px;

					> .icon {
						margin-left: 8px;
					}
				}
			}
		}
	}
}

._noGap_ .sqadhkmv {
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

._inContainer_ .sqadhkmv > * {
	margin: 0 !important;
	border: none;
	border-bottom: solid 0.5px var(--divider);
	border-radius: 0;
	box-shadow: none;
}
</style>

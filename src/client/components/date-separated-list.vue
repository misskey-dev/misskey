<template>
<component :is="$store.state.device.animation ? 'transition-group' : 'div'" class="sqadhkmv _list_" name="list" tag="div" :data-direction="direction" :data-reversed="reversed ? 'true' : 'false'">
	<template v-for="(item, i) in items">
		<slot :item="item"></slot>
		<div class="separator" v-if="showDate(i, item)" :key="item.id + '_date'">
			<p class="date">
				<span><fa class="icon" :icon="faAngleUp"/>{{ getDateText(item.createdAt) }}</span>
				<span>{{ getDateText(items[i + 1].createdAt) }}<fa class="icon" :icon="faAngleDown"/></span>
			</p>
		</div>
	</template>
</component>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';

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

	data() {
		return {
			faAngleUp, faAngleDown
		};
	},

	methods: {
		getDateText(time: string) {
			const date = new Date(time).getDate();
			const month = new Date(time).getMonth() + 1;
			return this.$t('monthAndDay', {
				month: month.toString(),
				day: date.toString()
			});
		},

		showDate(i, item) {
			return (
				i != this.items.length - 1 &&
				new Date(item.createdAt).getDate() != new Date(this.items[i + 1].createdAt).getDate() &&
				!item._prId_ &&
				!this.items[i + 1]._prId_ &&
				!item._featuredId_ &&
				!this.items[i + 1]._featuredId_);
		},

		focus() {
			this.$slots.default[0].elm.focus();
		}
	}
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
		> .list-enter {
			opacity: 0;
			transform: translateY(64px);
		}
	}

	&[data-direction="down"] {
		> .list-enter {
			opacity: 0;
			transform: translateY(-64px);
		}
	}
}
</style>

<style lang="scss" scoped>
.sqadhkmv {
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
</style>

<template>
<sequential-entrance class="sqadhkmv">
	<template v-for="(item, i) in items">
		<slot :item="item" :i="i"></slot>
		<div class="separator" :key="item.id + '_date'" :data-index="i" v-if="i != items.length - 1 && new Date(item.createdAt).getDate() != new Date(items[i + 1].createdAt).getDate()">
			<p class="date">
				<span><fa class="icon" :icon="faAngleUp"/>{{ getDateText(item.createdAt) }}</span>
				<span>{{ getDateText(items[i + 1].createdAt) }}<fa class="icon" :icon="faAngleDown"/></span>
			</p>
		</div>
	</template>
</sequential-entrance>
</template>

<script lang="ts">
import Vue from 'vue';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';

export default Vue.extend({
	i18n,

	props: {
		items: {
			type: Array,
			required: true,
		},
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
		}
	}
});
</script>

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
			color: #fff;
			border-radius: 64px;
			background: rgba(0, 0, 0, 0.5);

			@media (prefers-color-scheme: dark) {
				background: rgba(255, 255, 255, 0.08);
			}

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

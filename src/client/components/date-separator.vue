<template>
<div class="mk-date-separator">
	<p class="date">
		<span><fa class="icon" :icon="faAngleUp"/>{{ a }}</span>
		<span>{{ b }}<fa class="icon" :icon="faAngleDown"/></span>
	</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';

export default Vue.extend({
	i18n,

	props: {
		newer: {
			required: true
		},
		older: {
			required: true
		},
	},

	data() {
		return {
			faAngleUp, faAngleDown
		};
	},

	computed: {
		a(): string {
			const date = new Date(this.newer).getDate();
			const month = new Date(this.newer).getMonth() + 1;
			return this.$t('monthAndDay').replace('{month}', month.toString()).replace('{day}', date.toString());
		},
		b(): string {
			const date = new Date(this.older).getDate();
			const month = new Date(this.older).getMonth() + 1;
			return this.$t('monthAndDay').replace('{month}', month.toString()).replace('{day}', date.toString());
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-date-separator {
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

		span {
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

</style>

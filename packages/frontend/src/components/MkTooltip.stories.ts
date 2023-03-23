/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkTooltip from './MkTooltip.vue';
const meta = {
	title: 'components/MkTooltip',
	component: MkTooltip,
} satisfies Meta<typeof MkTooltip>;
export const Default = {
	render(args) {
		return {
			components: {
				MkTooltip,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkTooltip v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTooltip>;
export default meta;

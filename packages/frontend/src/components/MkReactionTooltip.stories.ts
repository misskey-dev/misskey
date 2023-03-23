/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkReactionTooltip from './MkReactionTooltip.vue';
const meta = {
	title: 'components/MkReactionTooltip',
	component: MkReactionTooltip,
} satisfies Meta<typeof MkReactionTooltip>;
export const Default = {
	render(args) {
		return {
			components: {
				MkReactionTooltip,
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
			template: '<MkReactionTooltip v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactionTooltip>;
export default meta;

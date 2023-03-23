/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUsersTooltip from './MkUsersTooltip.vue';
const meta = {
	title: 'components/MkUsersTooltip',
	component: MkUsersTooltip,
} satisfies Meta<typeof MkUsersTooltip>;
export const Default = {
	render(args) {
		return {
			components: {
				MkUsersTooltip,
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
			template: '<MkUsersTooltip v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUsersTooltip>;
export default meta;

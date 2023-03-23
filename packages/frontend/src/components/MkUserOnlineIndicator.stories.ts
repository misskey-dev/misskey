/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUserOnlineIndicator from './MkUserOnlineIndicator.vue';
const meta = {
	title: 'components/MkUserOnlineIndicator',
	component: MkUserOnlineIndicator,
} satisfies Meta<typeof MkUserOnlineIndicator>;
export const Default = {
	render(args) {
		return {
			components: {
				MkUserOnlineIndicator,
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
			template: '<MkUserOnlineIndicator v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserOnlineIndicator>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import RouterView from './RouterView.vue';
const meta = {
	title: 'components/global/RouterView',
	component: RouterView,
} satisfies Meta<typeof RouterView>;
export const Default = {
	render(args) {
		return {
			components: {
				RouterView,
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
			template: '<RouterView v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof RouterView>;
export default meta;

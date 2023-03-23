/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkInstanceTicker from './MkInstanceTicker.vue';
const meta = {
	title: 'components/MkInstanceTicker',
	component: MkInstanceTicker,
} satisfies Meta<typeof MkInstanceTicker>;
export const Default = {
	render(args) {
		return {
			components: {
				MkInstanceTicker,
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
			template: '<MkInstanceTicker v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkInstanceTicker>;
export default meta;

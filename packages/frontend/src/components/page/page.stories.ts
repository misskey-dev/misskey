/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_ from './page.vue';
const meta = {
	title: 'components/page/page',
	component: page_,
} satisfies Meta<typeof page_>;
export const Default = {
	render(args) {
		return {
			components: {
				page_,
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
			template: '<page_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_>;
export default meta;

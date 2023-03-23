/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import _loading_ from './_loading_.vue';
const meta = {
	title: 'pages/_loading_',
	component: _loading_,
} satisfies Meta<typeof _loading_>;
export const Default = {
	render(args) {
		return {
			components: {
				_loading_,
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
			template: '<_loading_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof _loading_>;
export default meta;

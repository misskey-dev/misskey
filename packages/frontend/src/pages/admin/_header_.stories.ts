/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import _header_ from './_header_.vue';
const meta = {
	title: 'pages/admin/_header_',
	component: _header_,
} satisfies Meta<typeof _header_>;
export const Default = {
	render(args) {
		return {
			components: {
				_header_,
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
			template: '<_header_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof _header_>;
export default meta;

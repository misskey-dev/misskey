/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUserName from './MkUserName.vue';
const meta = {
	title: 'components/global/MkUserName',
	component: MkUserName,
} satisfies Meta<typeof MkUserName>;
export const Default = {
	render(args) {
		return {
			components: {
				MkUserName,
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
			template: '<MkUserName v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserName>;
export default meta;

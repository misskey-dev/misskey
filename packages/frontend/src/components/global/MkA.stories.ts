/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta } from '@storybook/vue3';
const meta = {
	title: 'components/global/MkA',
	component: MkA,
} satisfies Meta<typeof MkA>;
export default meta;
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';
import { StoryObj } from '@storybook/vue3';
import { tick } from '@/scripts/test-utils';
import MkA from './MkA.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkA,
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
			template: '<MkA v-bind="props">Text</MkA>',
		};
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const a = canvas.getByRole<HTMLAnchorElement>('link');
		await expect(a.href).toMatch(/^https?:\/\/.*#test$/);
		await userEvent.click(a, { button: 2 });
		await tick();
		const menu = canvas.getByRole('menu');
		await expect(menu).toBeInTheDocument();
		await userEvent.click(a, { button: 0 });
		await tick();
		await expect(menu).not.toBeInTheDocument();
	},
	args: {
		to: '#test',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkA>;

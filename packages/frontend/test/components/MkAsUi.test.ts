import MkAsUi from '@/components/MkAsUi.vue';
import { components as globalComponents } from '@/components/index.js';
import { directives } from '@/directives/index.js';
import { describe, expect, test, vi } from 'vitest';
import { ComponentProps } from 'vue-component-type-helpers';
import { AsUiComponent } from '@/scripts/aiscript/ui.js';
import { ref } from 'vue';
import { shallowMount } from '@vue/test-utils';
import MkButton from '@/components/MkButton.vue';

describe('MkAsUi', () => {
	function renderComponent<C extends AsUiComponent>(
		component: C,
		opts?: Omit<ComponentProps<typeof MkAsUi>, 'component' | 'components'>
	) {
		const componentRef = ref(component);
		const componentsRef = ref([componentRef]);
		const wrapper = shallowMount(MkAsUi, {
			props: {
				component: componentRef.value,
				components: componentsRef.value,
				...opts,
			},
			global: { directives, components: globalComponents },
		});
		return { wrapper, component };
	}

	test('root', async () => {
		const { wrapper } = renderComponent({
			type: 'root',
			id: 'id',
			children: [],
		});
		expect(wrapper.text()).toBe('');
	});

	test('text', async () => {
		const { wrapper } = renderComponent({
			type: 'text',
			id: 'id',
			text: 'Hello, world!',
		});
		expect(wrapper.text()).toBe('Hello, world!');
	});

	test('mfm', async () => {
		const { component, wrapper } = renderComponent({
			type: 'mfm',
			id: 'id',
			text: '$[clickable.ev=evId Click me!]',
			onClickEv: vi.fn((evId) => {
				expect(evId).toBe('evId');
			}),
		});
		wrapper.findComponent(globalComponents.Mfm).vm.$emit('clickEv', 'evId');
		expect(component.onClickEv).toHaveBeenCalledOnce();
	});

	test('button', async () => {
		const { component, wrapper } = renderComponent({
			type: 'button',
			id: 'id',
			text: 'Click me!',
			onClick: vi.fn(),
		});
		wrapper.findComponent(MkButton).vm.$emit('click');
		expect(component.onClick).toHaveBeenCalledOnce();
	});

	test('buttons', async () => {
		const { component, wrapper } = renderComponent({
			type: 'buttons',
			id: 'id',
			buttons: [
				{
					text: 'left',
					onClick: vi.fn(),
				},
				{
					text: 'right',
					onClick: vi.fn(),
				},
			],
		});
		const buttons = wrapper.findAllComponents(MkButton);
		expect(buttons.length).toBe(2);

		const leftButton = buttons[0];
		leftButton.vm.$emit('click');
		expect(component.buttons[0].onClick).toHaveBeenCalledOnce();

		const rightButton = buttons[1];
		rightButton.vm.$emit('click');
		expect(component.buttons[1].onClick).toHaveBeenCalledOnce();
	});
});

import * as Matter from 'matter-js';

export function physics(container: HTMLElement) {
	const containerWidth = container.offsetWidth;
	const containerHeight = container.offsetHeight;
	const containerCenterX = containerWidth / 2;

	// サイズ固定化(要らないかも？)
	container.style.position = 'relative';
	container.style.boxSizing = 'border-box';
	container.style.width = `${containerWidth}px`;
	container.style.height = `${containerHeight}px`;

	// create engine
	const engine = Matter.Engine.create({
		constraintIterations: 4,
		positionIterations: 8,
		velocityIterations: 8,
	});

	const world = engine.world;

	// create renderer
	const render = Matter.Render.create({
		engine: engine,
		//element: document.getElementById('debug'),
		options: {
			width: containerWidth,
			height: containerHeight,
			background: 'transparent', // transparent to hide
			wireframeBackground: 'transparent', // transparent to hide
		}
	});

	// Disable to hide debug
	Matter.Render.run(render);

	// create runner
	const runner = Matter.Runner.create();
	Matter.Runner.run(runner, engine);

	const groundThickness = 1024;
	const ground = Matter.Bodies.rectangle(containerCenterX, containerHeight + (groundThickness / 2), containerWidth, groundThickness, {
		isStatic:     true,
		restitution:  0.1,
		friction:     2
	});

	//const wallRight = Matter.Bodies.rectangle(window.innerWidth+50, window.innerHeight/2, 100, window.innerHeight, wallopts);
	//const wallLeft = Matter.Bodies.rectangle(-50, window.innerHeight/2, 100, window.innerHeight, wallopts);

	Matter.World.add(world, [
		ground,
		//wallRight,
		//wallLeft,
	]);

	const objEls = Array.from(container.children);
	const objs = [];
	for (const objEl of objEls) {
		let obj;
		if (objEl.classList.contains('_physics_circle_')) {
			obj = Matter.Bodies.circle(
				objEl.offsetLeft + (objEl.offsetWidth / 2),
				objEl.offsetTop + (objEl.offsetHeight / 2),
				Math.max(objEl.offsetWidth, objEl.offsetHeight) / 2,
			);
		} else {
			const style = window.getComputedStyle(objEl);
			obj = Matter.Bodies.rectangle(
				objEl.offsetLeft + (objEl.offsetWidth / 2),
				objEl.offsetTop + (objEl.offsetHeight / 2),
				objEl.offsetWidth,
				objEl.offsetHeight,
				{
					chamfer: { radius: parseInt(style.borderRadius, 10) },
				}
			);
		}
		objEl.id = obj.id;
		objs.push(obj);
	}

	Matter.World.add(engine.world, objs);

	// Add mouse control

	const mouse = Matter.Mouse.create(container);
	const mouseConstraint = Matter.MouseConstraint.create(engine, {
		mouse: mouse,
		constraint: {
			stiffness: 0.05,
			render: {
				visible: false
			}
		}
	});

	Matter.World.add(engine.world, mouseConstraint);

	// keep the mouse in sync with rendering
	render.mouse = mouse;

	for (const objEl of objEls) {
		objEl.style.position = `absolute`;
		objEl.style.top = 0;
		objEl.style.left = 0;
		objEl.style.margin = 0;
		objEl.style.userSelect = 'none';
		objEl.style.willChange = 'transform';
	}

	window.requestAnimationFrame(update);

	let stop = false;

	function update() {
		for (const objEl of objEls) {
			const obj = objs.find(obj => obj.id.toString() === objEl.id.toString());
			if (obj == null) continue;

			const x = (obj.position.x - objEl.offsetWidth / 2);
			const y = (obj.position.y - objEl.offsetHeight / 2);
			const angle = obj.angle;

			objEl.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
		}

		if (!stop) {
			window.requestAnimationFrame(update);
		}
	}

	// 奈落に落ちたオブジェクトは消す
	const intervalId = setInterval(() => {
		for (const obj of objs) {
			if (obj.position.y > (containerHeight + 1024)) Matter.World.remove(world, obj);
		}
	}, 1000 * 10);

	return {
		stop: () => {
			stop = true;
			Matter.Runner.stop(runner);
			clearInterval(intervalId);
		}
	};
}

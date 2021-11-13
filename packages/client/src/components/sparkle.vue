<template>
<span class="mk-sparkle">
	<span ref="content">
		<slot></slot>
	</span>
	<canvas ref="canvas"></canvas>
</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

const sprite = new Image();
sprite.src = '/client-assets/sparkle-spritesheet.png';

export default defineComponent({
	props: {
		count: {
			type: Number,
			required: true,
		},
		speed: {
			type: Number,
			required: true,
		},
	},
	data() {
		return {
			sprites: [0,6,13,20],
			particles: [],
			anim: null,
			ctx: null,
		};
	},
	methods: {
		createSparkles(w, h, count) {
			var holder = [];

			for (var i = 0; i < count; i++) {

				const color = '#' + ('000000' + Math.floor(Math.random() * 16777215).toString(16)).slice(-6);

				holder[i] = {
					position: {
						x: Math.floor(Math.random() * w),
						y: Math.floor(Math.random() * h)
					},
					style: this.sprites[ Math.floor(Math.random() * 4) ],
					delta: {
						x: Math.floor(Math.random() * 1000) - 500,
						y: Math.floor(Math.random() * 1000) - 500
					},
					color: color,
					opacity: Math.random(),
				};

			}

			return holder;
		},
		draw(time) {
			this.ctx.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height);
			this.ctx.beginPath();

			const particleSize = Math.floor(this.fontSize / 2);
			this.particles.forEach((particle) => {
				var modulus = Math.floor(Math.random()*7);

				if (Math.floor(time) % modulus === 0) {
					particle.style = this.sprites[ Math.floor(Math.random()*4) ];
				}

				this.ctx.save();
				this.ctx.globalAlpha = particle.opacity;
				this.ctx.drawImage(sprite, particle.style, 0, 7, 7, particle.position.x, particle.position.y, particleSize, particleSize);

				this.ctx.globalCompositeOperation = "source-atop";
				this.ctx.globalAlpha = 0.5;
				this.ctx.fillStyle = particle.color;
				this.ctx.fillRect(particle.position.x, particle.position.y, particleSize, particleSize);

				this.ctx.restore();
			});
			this.ctx.stroke();
		},
		tick() {
			this.anim = window.requestAnimationFrame((time) => {
				if (!this.$refs.canvas) {
					return;
				}
				this.particles.forEach((particle) => {
					if (!particle) {
						return;
					}
					var randX = Math.random() > Math.random() * 2;
					var randY = Math.random() > Math.random() * 3;

					if (randX) {
						particle.position.x += (particle.delta.x * this.speed) / 1500;
					}

					if (!randY) {
						particle.position.y -= (particle.delta.y * this.speed) / 800;
					}

					if( particle.position.x > this.$refs.canvas.width ) {
						particle.position.x = -7;
					} else if (particle.position.x < -7) {
						particle.position.x = this.$refs.canvas.width;
					}

					if (particle.position.y > this.$refs.canvas.height) {
						particle.position.y = -7;
						particle.position.x = Math.floor(Math.random() * this.$refs.canvas.width);
					} else if (particle.position.y < -7) {
						particle.position.y = this.$refs.canvas.height;
						particle.position.x = Math.floor(Math.random() * this.$refs.canvas.width);
					}

					particle.opacity -= 0.005;

					if (particle.opacity <= 0) {
						particle.opacity = 1;
					}
				});

				this.draw(time);

				this.tick();
			});
		},
		resize() {
			if (this.$refs.content) {
				const contentRect = this.$refs.content.getBoundingClientRect();
				this.fontSize = parseFloat(getComputedStyle(this.$refs.content).fontSize);
				const padding = this.fontSize * 0.2;

				this.$refs.canvas.width = parseInt(contentRect.width + padding);
				this.$refs.canvas.height = parseInt(contentRect.height + padding);

				this.particles = this.createSparkles(this.$refs.canvas.width, this.$refs.canvas.height, this.count);
			}
		},
	},
	mounted() {
		this.ctx = this.$refs.canvas.getContext('2d');

		new ResizeObserver(this.resize).observe(this.$refs.content);

		this.resize();
		this.tick();
	},
	updated() {
		this.resize();
	},
	destroyed() {
		window.cancelAnimationFrame(this.anim);
	},
});
</script>

<style lang="scss" scoped>
.mk-sparkle {
	position: relative;
	display: inline-block;

	> span {
		display: inline-block;
	}

	> canvas {
		position: absolute;
		top: -0.1em;
		left: -0.1em;
		pointer-events: none;
	}
}
</style>

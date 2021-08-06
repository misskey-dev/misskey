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
import * as os from '@client/os';

const sprite = new Image();
sprite.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAHCAYAAAD5wDa1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozNDNFMzM5REEyMkUxMUUzOEE3NEI3Q0U1QUIzMTc4NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozNDNFMzM5RUEyMkUxMUUzOEE3NEI3Q0U1QUIzMTc4NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjM0M0UzMzlCQTIyRTExRTM4QTc0QjdDRTVBQjMxNzg2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjM0M0UzMzlDQTIyRTExRTM4QTc0QjdDRTVBQjMxNzg2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+jzOsUQAAANhJREFUeNqsks0KhCAUhW/Sz6pFSc1AD9HL+OBFbdsVOKWLajH9EE7GFBEjOMxcUNHD8dxPBCEE/DKyLGMqraoqcd4j0ChpUmlBEGCFRBzH2dbj5JycJAn90CEpy1J2SK4apVSM4yiKonhePYwxMU2TaJrm8BpykpWmKQ3D8FbX9SOO4/tOhDEG0zRhGAZo2xaiKDLyPGeSyPM8sCxr868+WC/mvu9j13XBtm1ACME8z7AsC/R9r0fGOf+arOu6jUwS7l6tT/B+xo+aDFRo5BykHfav3/gSYAAtIdQ1IT0puAAAAABJRU5ErkJggg==";


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
			fade: false,
			ctx: null,
		};
	},
	methods: {
		createSparkles(w, h, count) {
	    var holder = [];

	    for( var i = 0; i < count; i++ ) {

				const color = '#' + ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6);

	      holder[i] = {
	        position: {
	          x: Math.floor(Math.random()*w),
	          y: Math.floor(Math.random()*h)
	        },
	        style: this.sprites[ Math.floor(Math.random()*4) ],
	        delta: {
	          x: Math.floor(Math.random() * 1000) - 500,
	          y: Math.floor(Math.random() * 1000) - 500
	        },
	        size: parseFloat((Math.random()*2).toFixed(2)),
	        color: color,
					opacity: Math.random(),
	      };

	    }

	    return holder;
		},
		draw(time, fade) {
	    this.ctx.clearRect( 0, 0, this.$refs.canvas.width, this.$refs.canvas.height );
			this.ctx.beginPath();
	    this.particles.forEach((particle) => {
	      var modulus = Math.floor(Math.random()*7);

	      if( Math.floor(time) % modulus === 0 ) {
	        particle.style = this.sprites[ Math.floor(Math.random()*4) ];
	      }

	      this.ctx.save();
	      this.ctx.globalAlpha = particle.opacity;
	      this.ctx.drawImage(sprite, particle.style, 0, 7, 7, particle.position.x, particle.position.y, 7, 7);

        this.ctx.globalCompositeOperation = "source-atop";
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(particle.position.x, particle.position.y, 7, 7);

	      this.ctx.restore();
	    });
			this.ctx.stroke();
		},
		update() {
      this.anim = window.requestAnimationFrame((time) => {
				if (!this.$refs.canvas) {
					return;
				}
        this.particles.forEach((particle) => {
					if (!particle) {
						return;
					}
          var randX = ( Math.random() > Math.random()*2 );
          var randY = ( Math.random() > Math.random()*3 );

          if( randX ) {
            particle.position.x += ((particle.delta.x * this.speed) / 1500);
          }

          if( !randY ) {
            particle.position.y -= ((particle.delta.y * this.speed) / 800);
          }

          if( particle.position.x > this.$refs.canvas.width ) {
            particle.position.x = -7;
          } else if ( particle.position.x < -7 ) {
            particle.position.x = this.$refs.canvas.width;
          }

          if( particle.position.y > this.$refs.canvas.height ) {
            particle.position.y = -7;
            particle.position.x = Math.floor(Math.random()*this.$refs.canvas.width);
          } else if ( particle.position.y < -7 ) {
            particle.position.y = this.$refs.canvas.height;
            particle.position.x = Math.floor(Math.random()*this.$refs.canvas.width);
          }

          particle.opacity -= 0.005;

          if( particle.opacity <= 0 ) {
            particle.opacity = 1;
          }
				});

        this.draw(time);

        this.update();
      });
		},
		resize() {
			const contentRect = this.$refs.content.getBoundingClientRect();
			this.$refs.canvas.width = parseInt(contentRect.width) + 20;
			this.$refs.canvas.height = parseInt(contentRect.height + 20);

			this.particles = this.createSparkles(this.$refs.canvas.width, this.$refs.canvas.height, this.count);
		},
	},
	mounted() {
		this.ctx = this.$refs.canvas.getContext('2d');

		this.resize();
		this.update();
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

	> canvas {
		position: absolute;
		top: -10px;
		left: -10px;
		pointer-events: none;
	}
}
</style>

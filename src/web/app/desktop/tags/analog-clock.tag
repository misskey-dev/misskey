<mk-analog-clock>
	<canvas ref="canvas" width="256" height="256"></canvas>
	<style lang="stylus" scoped>
		:scope
			> canvas
				display block
				width 256px
				height 256px
	</style>
	<script>
		const Vec2 = function(x, y) {
			this.x = x;
			this.y = y;
		};

		this.on('mount', () => {
			this.draw()
			this.clock = setInterval(this.draw, 1000);
		});

		this.on('unmount', () => {
			clearInterval(this.clock);
		});

		this.draw = () => {
			const now = new Date();
			const s = now.getSeconds();
			const m = now.getMinutes();
			const h = now.getHours();

			const ctx = this.$refs.canvas.getContext('2d');
			const canvW = this.$refs.canvas.width;
			const canvH = this.$refs.canvas.height;
			ctx.clearRect(0, 0, canvW, canvH);

			{ // 背景
				const center = Math.min((canvW / 2), (canvH / 2));
				const lineStart =    center * 0.90;
				const shortLineEnd = center * 0.87;
				const longLineEnd =  center * 0.84;
				for (let i = 0; i < 60; i++) {
					const angle = Math.PI * i / 30;
					const uv = new Vec2(Math.sin(angle), -Math.cos(angle));
					ctx.beginPath();
					ctx.lineWidth = 1;
					ctx.moveTo((canvW / 2) + uv.x * lineStart, (canvH / 2) + uv.y * lineStart);
					if (i % 5 == 0) {
						ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
						ctx.lineTo((canvW / 2) + uv.x * longLineEnd, (canvH / 2) + uv.y * longLineEnd);
					} else {
						ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
						ctx.lineTo((canvW / 2) + uv.x * shortLineEnd, (canvH / 2) + uv.y * shortLineEnd);
					}
					ctx.stroke();
				}
			}

			{ // 分
				const angle = Math.PI * (m + s / 60) / 30;
				const length = Math.min(canvW, canvH) / 2.6;
				const uv = new Vec2(Math.sin(angle), -Math.cos(angle));
				ctx.beginPath();
				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = 2;
				ctx.moveTo(canvW / 2 - uv.x * length / 5, canvH / 2 - uv.y * length / 5);
				ctx.lineTo(canvW / 2 + uv.x * length,     canvH / 2 + uv.y * length);
				ctx.stroke();
			}

			{ // 時
				const angle = Math.PI * (h % 12 + m / 60) / 6;
				const length = Math.min(canvW, canvH) / 4;
				const uv = new Vec2(Math.sin(angle), -Math.cos(angle));
				ctx.beginPath();
				ctx.strokeStyle = _THEME_COLOR_;
				ctx.lineWidth = 2;
				ctx.moveTo(canvW / 2 - uv.x * length / 5, canvH / 2 - uv.y * length / 5);
				ctx.lineTo(canvW / 2 + uv.x * length,     canvH / 2 + uv.y * length);
				ctx.stroke();
			}

			{ // 秒
				const angle = Math.PI * s / 30;
				const length = Math.min(canvW, canvH) / 2.6;
				const uv = new Vec2(Math.sin(angle), -Math.cos(angle));
				ctx.beginPath();
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
				ctx.lineWidth = 1;
				ctx.moveTo(canvW / 2 - uv.x * length / 5, canvH / 2 - uv.y * length / 5);
				ctx.lineTo(canvW / 2 + uv.x * length,     canvH / 2 + uv.y * length);
				ctx.stroke();
			}
		};
	</script>
</mk-analog-clock>

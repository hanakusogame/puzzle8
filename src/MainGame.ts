import { MainScene } from "./MainScene";
declare function require(x: string): any;

//メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);
		const sizeW = 500;
		const sizeH = 360;
		super({ scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true });

		const bg = new g.FrameSprite({
			scene: scene,
			src: scene.assets["waku"] as g.ImageAsset,
			x: 120, y: 50,
			width: 260, height: 260,
			frames: [0, 1]
		});
		this.append(bg);

		const base = new g.E({
			scene: scene,
			x: 10,
			y: 10
		});
		bg.append(base);

		const maps: g.FilledRect[][] = [];
		const panelNum = 3;
		const panelSize = 80;
		let stageNum = 0;
		//パネル配置用マップ
		for (let y = 0; y < panelNum; y++) {
			maps[y] = [];
			for (let x = 0; x < panelNum; x++) {
				const map = new g.FilledRect({
					scene: scene,
					x: panelSize * x,
					y: panelSize * y,
					width: panelSize,
					height: panelSize,
					cssColor: "black",
					touchable: true,
					opacity: 0.0
				});
				base.append(map);
				maps[y][x] = map;
				map.pointDown.add(() => {
					if (!scene.isStart || isStop) return;
					if (move(x, y)) {
						clear();
					}
				});
			}
		}

		const dx = [0, 0, -1, 1];
		const dy = [-1, 1, 0, 0];
		//移動
		const move = (x: number, y: number): boolean => {
			const map = maps[y][x];
			if (map.tag !== undefined) {
				const panel: g.FilledRect = map.tag;
				for (let i = 0; i < dx.length; i++) {
					if (moveSub(x, y, i)) return true;
				}
			}
			return false;
		};

		//移動サブ処理(再帰)
		const moveSub = (x: number, y: number, i: number): boolean => {
			const map = maps[y][x];
			const panel: g.FilledRect = map.tag;
			const xx = x + dx[i];
			const yy = y + dy[i];
			if (xx >= 0 && yy >= 0 && xx < panelNum && yy < panelNum) {
				const mapd = maps[yy][xx];
				if (!mapd.tag ? true : moveSub(xx, yy, i)) {
					mapd.tag = map.tag;
					map.tag = undefined;
					timeline.create(panel).moveTo(mapd.x, mapd.y, 50);
					return true;
				}
			}
			return false;
		};

		//クリア処理(判定も含む)
		const clear = () => {
			let cnt = 0;
			//判定
			for (let y = 0; y < panelNum; y++) {
				let flg = true;
				for (let x = 0; x < panelNum; x++) {
					const panel: g.FilledRect = maps[y][x].tag;
					if (panel && panel.tag === cnt) {
						cnt++;
					} else {
						flg = false;
						break;
					}
				}
				if (!flg) break;
			}

			if (cnt === panelNum * panelNum - 1) {
				//クリア処理
				sprClear.show();
				bg.frameNumber = 1;
				isStop = true;

				for (let i = 0; i < panels.length - 1; i++) {
					panels[i].frameNumber = 1;
					panels[i].modified();
				}
				bg.modified();
				scene.addScore(3000);

				scene.playSound("se_clear");

				timeline.create().wait(1500).call(() => {
					next();
				});
			} else {
				scene.playSound("se_move");
			}
		};

		const glyph = JSON.parse((scene.assets["glyph72"] as g.TextAsset).data);
		const font = new g.BitmapFont({
			src: scene.assets["number_b"],
			map: glyph.map,
			defaultGlyphWidth: 72,
			defaultGlyphHeight: 80
		});

		//パネル
		const panels: g.FrameSprite[] = [];
		for (let i = 0; i < panelNum * panelNum - 1; i++) {
			const panel = new g.FrameSprite({
				scene: scene,
				width: panelSize,
				height: panelSize,
				src: scene.assets["panel"] as g.ImageAsset,
				frames: [0, 1]
			});
			base.append(panel);
			panels[i] = panel;
			panel.tag = i;

			const label = new g.Label({
				scene: scene,
				font: font,
				text: "" + (i + 1),
				fontSize: 72,
				x: 6,
				y: 4
			});
			panel.append(label);
		}
		panels[panels.length] = undefined;

		//クリア文字
		const sprClear = new g.Sprite({
			scene: scene,
			src: scene.assets["clear"],
			height: 80,
			x: 140,
			y: 140
		});
		this.append(sprClear);

		let isStop = false;
		this.pointDown.add((e) => {
			if (!scene.isStart || isStop) return;
		});

		this.pointMove.add((e) => {
			if (!scene.isStart || isStop) return;
		});

		this.pointUp.add((e) => {
			if (!scene.isStart || isStop) return;
		});

		const next = () => {
			isStop = false;
			stageNum++;
			for (let i = 0; i < panels.length; i++) {
				const x = (i % 3);
				const y = Math.floor(i / 3);
				maps[y][x].tag = panels[i];
			}

			//シャッフル
			let px = panelNum - 1;
			let py = panelNum - 1;
			for (let i = 0; i < 1000; i++) {
				const num = scene.random.get(0, dx.length - 1);
				const x = px + dx[num];
				const y = py + dy[num];
				if (x >= 0 && y >= 0 && x < panelNum && y < panelNum) {
					const mapd = maps[py][px];
					const map = maps[y][x];
					mapd.tag = map.tag;
					map.tag = undefined;
					px = x;
					py = y;
				}
			}

			//配置
			for (let y = 0; y < panelNum; y++) {
				for (let x = 0; x < panelNum; x++) {
					const num = y * panelNum + x;
					const map = maps[y][x];
					const panel: g.FilledRect = map.tag;
					if (panel) {
						panel.moveTo(map.x, map.y);
						panel.modified();
					}
				}
			}

			sprClear.hide();

			bg.frameNumber = 0;
			bg.modified();

			for (let i = 0; i < panels.length - 1; i++) {
				panels[i].frameNumber = 0;
				panels[i].modified();
			}

			scene.setStage(stageNum);

			isStop = false;
		};

		//終了イベント
		scene.finishEvent = () => {
			if (isStop) return;
			let cnt = 0;
			for (let i = 0; i < panels.length; i++) {
				const x = (i % 3);
				const y = Math.floor(i / 3);
				const panel: g.FrameSprite = maps[y][x].tag;
				if (panel && panel.tag === i) {
					panel.frameNumber = 1;
					panel.modified();
					cnt++;
				}
			}

			if (cnt !== 0) {
				scene.addScore(cnt * 300);
				scene.playSound("se_clear");
			}
		};

		//リセット
		this.reset = () => {
			stageNum = 0;
			next();
		};

	}
}

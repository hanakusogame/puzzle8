"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(scene);
        var sizeW = 500;
        var sizeH = 360;
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true }) || this;
        var bg = new g.FrameSprite({
            scene: scene,
            src: scene.assets["waku"],
            x: 120, y: 50,
            width: 260, height: 260,
            frames: [0, 1]
        });
        _this.append(bg);
        var base = new g.E({
            scene: scene,
            x: 10,
            y: 10
        });
        bg.append(base);
        var maps = [];
        var panelNum = 3;
        var panelSize = 80;
        var stageNum = 0;
        var _loop_1 = function (y) {
            maps[y] = [];
            var _loop_2 = function (x) {
                var map = new g.FilledRect({
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
                map.pointDown.add(function () {
                    if (!scene.isStart || isStop)
                        return;
                    if (move(x, y)) {
                        clear();
                    }
                });
            };
            for (var x = 0; x < panelNum; x++) {
                _loop_2(x);
            }
        };
        //パネル配置用マップ
        for (var y = 0; y < panelNum; y++) {
            _loop_1(y);
        }
        var dx = [0, 0, -1, 1];
        var dy = [-1, 1, 0, 0];
        //移動
        var move = function (x, y) {
            var map = maps[y][x];
            if (map.tag !== undefined) {
                var panel = map.tag;
                for (var i = 0; i < dx.length; i++) {
                    if (moveSub(x, y, i))
                        return true;
                }
            }
            return false;
        };
        //移動サブ処理(再帰)
        var moveSub = function (x, y, i) {
            var map = maps[y][x];
            var panel = map.tag;
            var xx = x + dx[i];
            var yy = y + dy[i];
            if (xx >= 0 && yy >= 0 && xx < panelNum && yy < panelNum) {
                var mapd = maps[yy][xx];
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
        var clear = function () {
            var cnt = 0;
            //判定
            for (var y = 0; y < panelNum; y++) {
                var flg = true;
                for (var x = 0; x < panelNum; x++) {
                    var panel = maps[y][x].tag;
                    if (panel && panel.tag === cnt) {
                        cnt++;
                    }
                    else {
                        flg = false;
                        break;
                    }
                }
                if (!flg)
                    break;
            }
            if (cnt === panelNum * panelNum - 1) {
                //クリア処理
                sprClear.show();
                bg.frameNumber = 1;
                isStop = true;
                for (var i = 0; i < panels.length - 1; i++) {
                    panels[i].frameNumber = 1;
                    panels[i].modified();
                }
                bg.modified();
                scene.addScore(3000);
                scene.playSound("se_clear");
                timeline.create().wait(1500).call(function () {
                    next();
                });
            }
            else {
                scene.playSound("se_move");
            }
        };
        var glyph = JSON.parse(scene.assets["glyph72"].data);
        var font = new g.BitmapFont({
            src: scene.assets["number_b"],
            map: glyph.map,
            defaultGlyphWidth: 72,
            defaultGlyphHeight: 80
        });
        //パネル
        var panels = [];
        for (var i = 0; i < panelNum * panelNum - 1; i++) {
            var panel = new g.FrameSprite({
                scene: scene,
                width: panelSize,
                height: panelSize,
                src: scene.assets["panel"],
                frames: [0, 1]
            });
            base.append(panel);
            panels[i] = panel;
            panel.tag = i;
            var label = new g.Label({
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
        var sprClear = new g.Sprite({
            scene: scene,
            src: scene.assets["clear"],
            height: 80,
            x: 140,
            y: 140
        });
        _this.append(sprClear);
        var isStop = false;
        _this.pointDown.add(function (e) {
            if (!scene.isStart || isStop)
                return;
        });
        _this.pointMove.add(function (e) {
            if (!scene.isStart || isStop)
                return;
        });
        _this.pointUp.add(function (e) {
            if (!scene.isStart || isStop)
                return;
        });
        var next = function () {
            isStop = false;
            stageNum++;
            for (var i = 0; i < panels.length; i++) {
                var x = (i % 3);
                var y = Math.floor(i / 3);
                maps[y][x].tag = panels[i];
            }
            //シャッフル
            var px = panelNum - 1;
            var py = panelNum - 1;
            for (var i = 0; i < 1000; i++) {
                var num = scene.random.get(0, dx.length - 1);
                var x = px + dx[num];
                var y = py + dy[num];
                if (x >= 0 && y >= 0 && x < panelNum && y < panelNum) {
                    var mapd = maps[py][px];
                    var map = maps[y][x];
                    mapd.tag = map.tag;
                    map.tag = undefined;
                    px = x;
                    py = y;
                }
            }
            //配置
            for (var y = 0; y < panelNum; y++) {
                for (var x = 0; x < panelNum; x++) {
                    var num = y * panelNum + x;
                    var map = maps[y][x];
                    var panel = map.tag;
                    if (panel) {
                        panel.moveTo(map.x, map.y);
                        panel.modified();
                    }
                }
            }
            sprClear.hide();
            bg.frameNumber = 0;
            bg.modified();
            for (var i = 0; i < panels.length - 1; i++) {
                panels[i].frameNumber = 0;
                panels[i].modified();
            }
            scene.setStage(stageNum);
            isStop = false;
        };
        //終了イベント
        scene.finishEvent = function () {
            if (isStop)
                return;
            var cnt = 0;
            for (var i = 0; i < panels.length; i++) {
                var x = (i % 3);
                var y = Math.floor(i / 3);
                var panel = maps[y][x].tag;
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
        _this.reset = function () {
            stageNum = 0;
            next();
        };
        return _this;
    }
    return MainGame;
}(g.E));
exports.MainGame = MainGame;

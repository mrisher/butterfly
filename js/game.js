// Audio (procedural Web Audio synth) lives in js/audio.js, loaded before this file.
// `synth` is a global: call synth.playCatch() / synth.playMiss().
//
// All tunable values (path geometry, green zone, speed, colors, timings) live
// in js/config.js, loaded before this file.

const config = {
    type: Phaser.AUTO,
    backgroundColor: BG_COLOR,
    parent: 'game-container',
    scale: {
        // FIT keeps the 800x600 game world fixed and scales the canvas to fit
        // the container, letterboxing as needed — so it works on any screen.
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let score = 0;
let scoreText;
let butterfly;
let path;
let trackGraphics;
let greenZoneGraphics;

const game = new Phaser.Game(config);

function preload() {
    // Butterfly sprite is an SVG asset (assets/butterfly.svg).
    this.load.svg('butterfly-poly', 'assets/butterfly.svg', {
        width: BUTTERFLY_SIZE,
        height: BUTTERFLY_SIZE
    });
}

function create() {
    // 1. Create the semi-circle path pointing upwards.
    // Starts on the left (PATH_CENTER_X - PATH_RADIUS) and arcs over the top.
    path = new Phaser.Curves.Path(PATH_CENTER_X - PATH_RADIUS, PATH_CENTER_Y);
    path.ellipseTo(PATH_RADIUS, PATH_RADIUS, 180, 360, false, 0);

    // 2. Draw the visual track + a thin neon glow on top of it.
    trackGraphics = this.add.graphics();
    trackGraphics.lineStyle(TRACK_WIDTH, COLOR_TRACK, 1);
    path.draw(trackGraphics);

    const trackGlow = this.add.graphics();
    trackGlow.lineStyle(TRACK_GLOW_WIDTH, COLOR_TRACK_GLOW, 0.4);
    path.draw(trackGlow);

    // 3. Draw the Green Catch Zone.
    // Path progress maps linearly onto the arc angle: t=0 -> 180° (PI),
    // t=1 -> 360° (2*PI), so angle = PI + t*PI.
    greenZoneGraphics = this.add.graphics();
    greenZoneGraphics.lineStyle(GREEN_ZONE_WIDTH, COLOR_GREEN_ZONE, 0.8);

    const angleStart = Math.PI + (GREEN_ZONE_START * Math.PI);
    const angleEnd = Math.PI + (GREEN_ZONE_END * Math.PI);

    greenZoneGraphics.beginPath();
    greenZoneGraphics.arc(PATH_CENTER_X, PATH_CENTER_Y, PATH_RADIUS, angleStart, angleEnd, false);
    greenZoneGraphics.strokePath();

    // Add a soft broad glow behind the green zone.
    const greenGlow = this.add.graphics();
    greenGlow.lineStyle(GREEN_GLOW_WIDTH, COLOR_GREEN_ZONE, 0.2);
    greenGlow.beginPath();
    greenGlow.arc(PATH_CENTER_X, PATH_CENTER_Y, PATH_RADIUS, angleStart, angleEnd, false);
    greenGlow.strokePath();

    // 4. Create the butterfly follower at the path start.
    butterfly = this.add.follower(path, PATH_CENTER_X - PATH_RADIUS, PATH_CENTER_Y, 'butterfly-poly');

    butterfly.startFollow({
        duration: BUTTERFLY_DURATION, // ms to traverse the full arc one way
        yoyo: true,                    // fly back and forth
        repeat: -1,                    // loop forever
        rotateToPath: true,            // align direction along the path
        rotationOffset: BUTTERFLY_ROTATION_OFFSET // align the sprite's top along the curve
    });

    // 5. Score UI Text
    scoreText = this.add.text(PATH_CENTER_X, SCORE_Y, 'SCORE: 0', {
        fontFamily: SCORE_FONT,
        fontSize: SCORE_FONT_SIZE,
        color: SCORE_COLOR
    }).setOrigin(0.5);
    scoreText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 5);

    // 6. Spacebar Interaction Setup (Native window listener for 100% reliability)
    this.spaceListener = (event) => {
        if (event.code === 'Space' || event.keyCode === 32) {
            event.preventDefault();
            if (event.repeat) return; // Prevent rapid-fire on hold
            handleCatch(this);
        }
    };
    window.addEventListener('keydown', this.spaceListener);

    // 8. Tap / click anywhere also triggers a catch (same as the spacebar).
    // On mobile this is the primary control; on desktop it's a bonus.
    this.input.on('pointerdown', () => handleCatch(this));

    // Clean up key listener on scene shutdown to prevent memory leaks
    this.events.once('shutdown', () => {
        window.removeEventListener('keydown', this.spaceListener);
    });

    // Initialize tracking variables for movement direction
    this.lastT = 0;
    this.isMovingForward = true;
}

// Standalone Helper for catching logic
function handleCatch(scene) {
    // Phaser 3.60 PathFollower exposes path progress via the tween's value,
    // not a `t` property. Reading `butterfly.t` returns undefined, which would
    // silently swallow every keypress — so guard against a missing tween instead.
    if (!butterfly || !butterfly.pathTween) return;
    const progress = butterfly.pathTween.getValue();

    // Check if progress is inside the designated green zone
    if (progress >= GREEN_ZONE_START && progress <= GREEN_ZONE_END) {
        // CATCH SUCCESS
        score++;
        scoreText.setText('SCORE: ' + score);

        synth.playCatch();
        scene.cameras.main.flash(FLASH_DURATION, FLASH_GREEN.r, FLASH_GREEN.g, FLASH_GREEN.b);

        // Determine precision feedback
        let feedback = "CATCH!";
        let color = COLOR_CATCH;

        if (progress >= PERFECT_START && progress <= PERFECT_END) {
            feedback = "PERFECT!!!";
            color = COLOR_PERFECT;
        } else if ((scene.isMovingForward && progress < PERFECT_START) || (!scene.isMovingForward && progress > PERFECT_END)) {
            feedback = "EARLY!";
            color = COLOR_EARLY;
        } else {
            feedback = "LATE!";
            color = COLOR_LATE;
        }

        showFeedbackText(scene, butterfly.x, butterfly.y, feedback, color);

        // Pop scaling animation on success
        scene.tweens.add({
            targets: butterfly,
            scaleX: POP_SCALE,
            scaleY: POP_SCALE,
            duration: POP_DURATION,
            yoyo: true,
            repeat: 0,
            ease: 'Quad.easeInOut'
        });

        // Brief color-tint to matching feedback color
        butterfly.setTint(Phaser.Display.Color.HexStringToColor(color).color);
        scene.time.delayedCall(TINT_CLEAR_DELAY, () => {
            butterfly.clearTint();
        });

    } else {
        // CATCH MISS
        synth.playMiss();
        scene.cameras.main.flash(FLASH_DURATION, FLASH_RED.r, FLASH_RED.g, FLASH_RED.b);
        scene.cameras.main.shake(SHAKE_DURATION, SHAKE_INTENSITY);

        showFeedbackText(scene, butterfly.x, butterfly.y, `MISS! (t: ${progress.toFixed(2)})`, COLOR_MISS);
    }
}

// Standalone Helper for floating arcade-style text
function showFeedbackText(scene, x, y, text, color) {
    const fbText = scene.add.text(x, y - FEEDBACK_START_OFFSET, text, {
        fontFamily: FEEDBACK_FONT,
        fontSize: FEEDBACK_FONT_SIZE,
        color: color,
        stroke: '#000000',
        strokeThickness: 5
    }).setOrigin(0.5);

    scene.tweens.add({
        targets: fbText,
        y: y - (FEEDBACK_START_OFFSET + FEEDBACK_RISE),
        alpha: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: FEEDBACK_DURATION,
        onComplete: () => {
            fbText.destroy();
        }
    });
}

function update() {
    // Determine movement direction dynamically of the follower with safety checks.
    // Path progress comes from the tween (butterfly.pathTween.getValue()), not a
    // `t` property — that was undefined, freezing this whole block.
    if (butterfly && butterfly.pathTween) {
        const currentT = butterfly.pathTween.getValue();

        // Ensure lastT is initialized
        if (this.lastT === undefined) {
            this.lastT = currentT;
        }

        this.isMovingForward = currentT >= this.lastT;
        this.lastT = currentT;
    }
}

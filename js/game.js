// Audio (procedural Web Audio synth) lives in js/audio.js, loaded before this file.
// `synth` is a global: call synth.playCatch() / synth.playMiss().

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#090d16',
    parent: 'game-container',
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

// Define Path Constants
const centerX = 400;
const centerY = 450;
const radius = 300;

// Green zone range on the path (represented as normalized progress 0 to 1)
const greenZoneStart = 0.4;
const greenZoneEnd = 0.6;

const game = new Phaser.Game(config);

function preload() {
    // Butterfly sprite is an SVG asset (assets/butterfly.svg), rasterized to 50x50.
    this.load.svg('butterfly-poly', 'assets/butterfly.svg', { width: 50, height: 50 });
}

function create() {
    // 1. Create a beautiful semi-circle path pointing upwards
    // Starting on the left (x = centerX - radius, y = centerY)
    path = new Phaser.Curves.Path(centerX - radius, centerY);
    // Draw an arc from 180 to 360 degrees (semi-circle on top)
    path.ellipseTo(radius, radius, 180, 360, false, 0);

    // 2. Draw the visual track
    trackGraphics = this.add.graphics();
    trackGraphics.lineStyle(6, 0x1e293b, 1); // Sleek track background
    path.draw(trackGraphics);
    
    // Add a cool neon glow to the track
    const trackGlow = this.add.graphics();
    trackGlow.lineStyle(2, 0x3b82f6, 0.4); // Thin neon blue glow
    path.draw(trackGlow);

    // 3. Draw the Green Catch Zone
    greenZoneGraphics = this.add.graphics();
    greenZoneGraphics.lineStyle(14, 0x10b981, 0.8); // Glowing green thickness 14
    
    // Map path progress (0.4 to 0.6) back to angles in radians for drawing
    // t=0 -> 180deg (Math.PI)
    // t=1 -> 360deg (2*Math.PI)
    const angleStart = Math.PI + (greenZoneStart * Math.PI);
    const angleEnd = Math.PI + (greenZoneEnd * Math.PI);
    
    greenZoneGraphics.beginPath();
    greenZoneGraphics.arc(centerX, centerY, radius, angleStart, angleEnd, false);
    greenZoneGraphics.strokePath();

    // Add a glowing effect to the green zone
    const greenGlow = this.add.graphics();
    greenGlow.lineStyle(24, 0x10b981, 0.2); // Very soft broad green glow
    greenGlow.beginPath();
    greenGlow.arc(centerX, centerY, radius, angleStart, angleEnd, false);
    greenGlow.strokePath();

    // 4. Butterfly sprite is now loaded from SVG in preload() (assets/butterfly.svg).

    // 5. Create Follower along the path
    // Spawn at path start
    butterfly = this.add.follower(path, centerX - radius, centerY, 'butterfly-poly');
    
    // Start following back and forth
    butterfly.startFollow({
        duration: 1200, // Time in ms to traverse the entire arc (much faster and more challenging)
        yoyo: true,     // Fly back and forth
        repeat: -1,     // Loop forever
        rotateToPath: true, // Align direction along the path
        rotationOffset: 90 // Align the top of our butterfly (facing up) along the curve
    });

    // 6. Score UI Text
    scoreText = this.add.text(centerX, 60, 'SCORE: 0', {
        fontFamily: '"Fredoka One", cursive, sans-serif',
        fontSize: '48px',
        color: '#f8fafc'
    }).setOrigin(0.5);
    
    // Add a neat drop shadow to score text
    scoreText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 5);

    // 7. Spacebar Interaction Setup (Native window listener for 100% reliability)
    this.spaceListener = (event) => {
        if (event.code === 'Space' || event.keyCode === 32) {
            event.preventDefault();
            if (event.repeat) return; // Prevent rapid-fire on hold
            handleCatch(this);
        }
    };
    window.addEventListener('keydown', this.spaceListener);

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
    if (progress >= greenZoneStart && progress <= greenZoneEnd) {
        // CATCH SUCCESS
        score++;
        scoreText.setText('SCORE: ' + score);
        
        // Procedural catch sound
        synth.playCatch();

        // Flashes camera green briefly
        scene.cameras.main.flash(200, 16, 185, 129);

        // Determine precision feedback
        let feedback = "CATCH!";
        let color = "#34d399"; // Emerald green
        
        if (progress >= 0.47 && progress <= 0.53) {
            feedback = "PERFECT!!!";
            color = "#fcd34d"; // Gold
        } else if ((scene.isMovingForward && progress < 0.47) || (!scene.isMovingForward && progress > 0.53)) {
            feedback = "EARLY!";
            color = "#60a5fa"; // Blue
        } else {
            feedback = "LATE!";
            color = "#f87171"; // Coral red
        }

        showFeedbackText(scene, butterfly.x, butterfly.y, feedback, color);

        // Pop scaling animation on success
        scene.tweens.add({
            targets: butterfly,
            scaleX: 1.6,
            scaleY: 1.6,
            duration: 120,
            yoyo: true,
            repeat: 0,
            ease: 'Quad.easeInOut'
        });

        // Brief color-tint to matching feedback color
        butterfly.setTint(Phaser.Display.Color.HexStringToColor(color).color);
        scene.time.delayedCall(300, () => {
            butterfly.clearTint();
        });

    } else {
        // CATCH MISS
        // Procedural miss sound
        synth.playMiss();

        // Flashes camera red briefly
        scene.cameras.main.flash(200, 239, 68, 68);

        // Miss shaking effect
        scene.cameras.main.shake(100, 0.01);

        // Show "MISS!" floating feedback with t value to diagnose hits
        showFeedbackText(scene, butterfly.x, butterfly.y, `MISS! (t: ${progress.toFixed(2)})`, "#ef4444");
    }
}

// Standalone Helper for floating arcade-style text
function showFeedbackText(scene, x, y, text, color) {
    const fbText = scene.add.text(x, y - 30, text, {
        fontFamily: '"Fredoka One", cursive, sans-serif',
        fontSize: '24px',
        color: color,
        stroke: '#000000',
        strokeThickness: 5
    }).setOrigin(0.5);
    
    scene.tweens.add({
        targets: fbText,
        y: y - 80,
        alpha: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 600,
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
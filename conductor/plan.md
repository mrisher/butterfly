# Phaser Butterfly Game - Step 1 Plan

## Objective
Implement Step 1 of a web-based "Butterfly Catch" game using the Phaser 3 framework. The game will feature a placeholder polygon (butterfly) animating along a semi-circular arc. The player presses the spacebar to "catch" the butterfly when it enters a visually distinct "green zone" on the arc, increasing their score.

## Key Files
- `index.html`: The main entry point, loading Phaser via CDN and our game script.
- `js/game.js`: Contains all the Phaser 3 logic (Configuration, Preload, Create, Update).
- `css/style.css`: Minimal styling to center the game canvas on the screen.

## Implementation Steps

1. **Project Setup:**
   - Create `index.html` and include Phaser 3 via a CDN (e.g., cdnjs).
   - Create the file structure (`js/` and `css/` folders).

2. **Phaser Initialization:**
   - Initialize a Phaser `Game` instance in `js/game.js` with a defined width/height and a transparent or solid background.

3. **Scene Setup (`create` function):**
   - **Draw the Arc:** Use `Phaser.GameObjects.Graphics` to draw a semi-circle path to serve as the visual track.
   - **Draw the Green Zone:** Draw a thicker, green arc segment over the middle portion of the main track to visually indicate the catch zone.
   - **Define the Path:** Create a `Phaser.Curves.Path` that exactly matches the drawn arc.
   - **Create the Butterfly:** Draw a simple triangle using `Graphics` and generate a texture from it to act as the butterfly.
   - **Path Following:** Add the butterfly as a `follower` to the path. Configure it to yoyo (fly back and forth), repeat infinitely, and automatically rotate to face the path direction.
   - **UI:** Add a Text object to display the current Score.

4. **Input & Game Logic:**
   - Setup a keyboard listener for the `SPACE` key.
   - When pressed, evaluate the butterfly's position. Phaser path followers have a progress value (`t` between 0 and 1).
   - Determine if the progress `t` falls within the designated green zone range (e.g., between `0.4` and `0.6`).
   - If in the zone: Increment the score, update the UI, and optionally provide visual feedback (like a small particle effect or flash).

## Verification & Testing
- Open `index.html` in a browser.
- Verify the arc and green zone are drawn correctly.
- Verify the polygon smoothly animates back and forth along the arc and rotates correctly.
- Press Spacebar outside the green zone -> Score should not change.
- Press Spacebar inside the green zone -> Score should increase by 1.
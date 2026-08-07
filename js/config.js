// ── Game / canvas ────────────────────────────────────────────────────────
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BG_COLOR = '#090d16';

// ── Path geometry ────────────────────────────────────────────────────────
// A semi-circle arc anchored at the bottom of the screen, opening upward.
const PATH_CENTER_X = 400;
const PATH_CENTER_Y = 450;
const PATH_RADIUS = 300;

// ── Catch zone (path progress is normalized 0..1 along the arc) ──────────
const GREEN_ZONE_START = 0.4;
const GREEN_ZONE_END = 0.6;
// "PERFECT" is the dead-center slice of the green zone.
const PERFECT_START = 0.47;
const PERFECT_END = 0.53;

// ── Butterfly ────────────────────────────────────────────────────────────
const BUTTERFLY_SIZE = 50;              // SVG rasterization size (px)
const BUTTERFLY_DURATION = 1200;        // ms to traverse the full arc one way
const BUTTERFLY_ROTATION_OFFSET = 90;   // align sprite top along the curve

// ── Track & zone visuals ─────────────────────────────────────────────────
const TRACK_WIDTH = 6;
const TRACK_GLOW_WIDTH = 2;
const GREEN_ZONE_WIDTH = 14;
const GREEN_GLOW_WIDTH = 24;

const COLOR_TRACK = 0x1e293b;
const COLOR_TRACK_GLOW = 0x3b82f6;
const COLOR_GREEN_ZONE = 0x10b981;

// ── Feedback text colors ─────────────────────────────────────────────────
const COLOR_CATCH = '#34d399';   // emerald
const COLOR_PERFECT = '#fcd34d';  // gold
const COLOR_EARLY = '#60a5fa';    // blue
const COLOR_LATE = '#f87171';     // coral
const COLOR_MISS = '#ef4444';     // red

// ── Camera feedback ──────────────────────────────────────────────────────
const FLASH_DURATION = 200;          // ms
const FLASH_GREEN = { r: 16, g: 185, b: 129 };
const FLASH_RED = { r: 239, g: 68, b: 68 };
const SHAKE_DURATION = 100;           // ms
const SHAKE_INTENSITY = 0.01;

// ── Catch animation ───────────────────────────────────────────────────────
const POP_SCALE = 1.6;
const POP_DURATION = 120;             // ms
const TINT_CLEAR_DELAY = 300;         // ms

// ── Floating feedback text ───────────────────────────────────────────────
const FEEDBACK_FONT = '"Fredoka One", cursive, sans-serif';
const FEEDBACK_FONT_SIZE = '24px';
const FEEDBACK_RISE = 50;             // px the feedback floats up from the butterfly
const FEEDBACK_DURATION = 600;        // ms
const FEEDBACK_START_OFFSET = 30;     // px above the butterfly when it appears

// ── Score text ───────────────────────────────────────────────────────────
const SCORE_FONT = '"Fredoka One", cursive, sans-serif';
const SCORE_FONT_SIZE = '48px';
const SCORE_COLOR = '#f8fafc';
const SCORE_Y = 60;
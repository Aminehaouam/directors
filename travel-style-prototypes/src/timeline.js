// One story, one clock. Every prototype reads this file, so composition,
// timing, actions and camera are identical across the three styles.
// (Loaded by Node for the build and by the browser compositor.)
(function (root) {
  const TIMELINE = {
    duration: 10.0,
    fps: 30,
    size: [1080, 1920],
    // Rive state-machine triggers fired by the compositor: [time, artboard, input]
    cues: [
      [0.35, 'Journal', 'open'],
      [1.45, 'Ticket', 'slide'],
      [2.55, 'Ticket', 'unfold'],
      [3.7, 'LondonBack', 'popup'],
      [3.95, 'LondonFront', 'popup'],
      [4.35, 'BigBen', 'rise'],
      [5.05, 'Coco', 'flyIn'],
      [6.95, 'Coco', 'land'],
      [7.75, 'Coco', 'nudge'],
      [8.15, 'LondonBack', 'fold'],
      [8.15, 'LondonFront', 'fold'],
      [8.15, 'BigBen', 'fold'],
      [8.30, 'Ticket', 'map'],
      [9.45, 'Coco', 'cheer'],
    ],
    // Camera: [time, centerX, centerY, zoom, ease-to-this-key]
    camera: [
      [0.0, 770, 730, 1.26],
      [0.3, 770, 730, 1.26],
      [2.1, 540, 930, 1.0, 'inOut'],
      [3.3, 540, 1010, 1.03, 'inOut'],
      [5.4, 530, 1000, 1.06, 'inOut'],
      [7.3, 500, 1100, 1.05, 'inOut'],
      [8.3, 510, 1120, 1.05, 'inOut'],
      [10.0, 545, 1215, 1.1, 'inOut'],
    ],
    // Paint order, bottom to top.
    layers: ['Desk', 'Props', 'Journal', 'Ticket', 'LondonBack', 'BigBen', 'LondonFront', 'Coco'],
  };
  if (typeof module !== 'undefined') module.exports = TIMELINE; else root.TIMELINE = TIMELINE;
})(this);

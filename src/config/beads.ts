

export const BEADS_LIST = [8, 10, 12, 13, 14, 15, 16];

export const CUSTOM_RENDER_RATIO = 3;

export const BEADS_SIZE_RENDER = BEADS_LIST.map((item) => ({
  bead_diameter: item,
  render_diameter: item * CUSTOM_RENDER_RATIO,
}));
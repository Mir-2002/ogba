// GBA button names as understood by mGBA's buttonPress/buttonUnpress API.
// Case-insensitive on mGBA's side; we keep a single canonical casing here.
export type GbaButton =
  | 'A'
  | 'B'
  | 'L'
  | 'R'
  | 'Start'
  | 'Select'
  | 'Up'
  | 'Down'
  | 'Left'
  | 'Right'

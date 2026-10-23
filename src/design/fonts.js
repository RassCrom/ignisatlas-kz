// Self-hosted fonts (fontsource). Family names match the --font-* tokens in tokens.css.
// scripts/check-kazakh-glyphs.mjs reads this file to see which faces are shipped,
// so keep one bare `import '<package>/<file>.css'` per line.
import '@fontsource-variable/roboto-flex/full.css'; // all axes, including width
import '@fontsource-variable/onest/index.css';
import '@fontsource/spectral/300.css';
import '@fontsource/spectral/300-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

// The GitHub repos the site links to: the two apps', and llama.cpp's, which
// the docs describe and the Linux (command-line) install gets.
export const MACOS_REPO_URL = 'https://github.com/ggml-org/Llama-macOS';
export const WINDOWS_REPO_URL = 'https://github.com/ggml-org/Llama-Windows';
export const LLAMA_CPP_REPO_URL = 'https://github.com/ggml-org/llama.cpp';

// Direct dmg download for the Llama macOS app (ggml-org/Llama-macOS);
// `latest` redirects to the newest release so no version is hardcoded.
export const MACOS_DOWNLOAD_URL =
	'https://github.com/ggml-org/Llama-macOS/releases/latest/download/Llama.dmg';

// The Llama Windows app's latest release (ggml-org/Llama-Windows). Its
// assets have the version in their names, so there's no stable direct link
// like the Mac one; the homepage resolves the bundle's URL at build time
// (routes/+page.server.ts) and falls back to this page.
export const WINDOWS_RELEASES_URL = 'https://github.com/ggml-org/Llama-Windows/releases/latest';

export const SITE_TITLE = 'llama.app - Official home for llama.cpp';
export const SITE_DESCRIPTION = 'Official website for the llama.cpp project';
export const SITE_URL = 'https://llama.app';
export const OG_IMAGE_PATH = '/og-image-llama-cpp.png';
export const OG_IMAGE_ALT = 'llama.cpp - AI that lives on your computer';

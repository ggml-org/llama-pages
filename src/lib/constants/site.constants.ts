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

// The homepage's title and description, which also serve as every page's
// share preview (og:/twitter: tags, see SeoMetadata). Each page sets its own
// `<title>` and description; SeoMetadata doesn't, since a second `<title>`
// would win over the page's (browsers use the first one).
export const SITE_TITLE = 'Llama · Your AI, on your computer';
export const SITE_DESCRIPTION =
	'Run the latest open models on your computer. Chat with them, or connect them to your coding agents, editors, and apps. Free, private, and nothing to configure.';
export const SITE_URL = 'https://llama.app';
export const OG_IMAGE_PATH = '/og-image-llama-cpp.png';
export const OG_IMAGE_ALT = 'llama.cpp - AI that lives on your computer';

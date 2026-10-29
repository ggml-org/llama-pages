// Constants shared by docs-related components.

/** LocalStorage key for the user's Llama server URL. */
export const STORAGE_KEY = 'LlamaApp.serverUrl';

/**
 * LocalStorage key set once the visitor connects Llama from the header.
 * Until then the site never contacts the server, since in Chrome the first
 * request shows a Local Network Access permission prompt.
 */
export const CONNECTED_KEY = 'LlamaApp.connected';

/** Maximum length of a doc page's content when inlining into the Llama prompt. */
export const LLAMA_PROMPT_MAX_CHARS = 6000;

/** How long (ms) the "copied" feedback stays visible on a copy button. */
export const COPY_FEEDBACK_MS = 2000;

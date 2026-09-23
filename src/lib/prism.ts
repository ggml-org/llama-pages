// Prism with the extra grammars the homepage snippets need.
//
// The grammar files are side-effect scripts that register themselves on the
// global `Prism`, so they must run after the core. The import sorter would
// hoist them above it, hence the disable.
/* eslint-disable simple-import-sort/imports */
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';

export default Prism;

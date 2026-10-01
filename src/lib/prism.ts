// Prism with the extra grammar the homepage's API snippet needs (bash).
//
// Grammar files are side-effect scripts that register themselves on the
// global `Prism`, so they must run after the core. The import sorter would
// hoist them above it, hence the disable.
/* eslint-disable simple-import-sort/imports */
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';

export default Prism;

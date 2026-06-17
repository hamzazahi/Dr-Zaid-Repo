---
name: MUI Icons + Vite + React 19 barrel import fix
description: Individual icon path imports cause two React instances in Vite, breaking React 19 with "Invalid hook call" + "Element type is invalid: got object"
---

## The Rule
**Never** use individual icon path imports like:
```js
import DashboardIcon from '@mui/icons-material/Dashboard';
```
**Always** use named barrel imports:
```js
import { Dashboard as DashboardIcon } from '@mui/icons-material';
```

**Why:** Vite pre-bundles each CJS icon file separately, giving each its own React instance. React 19's reconciler then sees forwardRef/memo components whose `$$typeof` Symbol comes from a different React instance than the app uses. This triggers "Invalid hook call" (two React copies) + "Element type is invalid: got object" (unrecognized $$typeof).

**How to apply:** Any time MUI icons are imported anywhere in this project. Run the fix_icons.js transform script if many files need updating at once. The ESM barrel at `@mui/icons-material/esm/index.js` shares one React instance via Vite's bundler, so all icons resolve correctly.

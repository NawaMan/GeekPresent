// Which GeekPresent this is — shown quietly at the foot of the ☰ menu.
//
// In this repo it reads the package's own version and says `-dev`: the showcase site is
// built from whatever main holds, which is never exactly a release. The packed tarball
// REPLACES this file with the plain released number (utils/pack-core.mjs → versionModule),
// because a project cannot reach packages/core/package.json from inside node_modules.
import pkg from '../../packages/core/package.json';

export const GEEKPRESENT_VERSION: string = `${pkg.version}-dev`;

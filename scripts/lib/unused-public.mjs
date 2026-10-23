// Static text of a template literal that ends right before `${`: the run of
// characters after the opening backtick or after the `}` of an earlier
// substitution. `/icons/${name}.svg` gives "/icons/".
const TEMPLATE_PREFIX = /[`}]((?:(?!\$\{)[^`}])*)\$\{/g;

// A bare "/" (as in `${base}/${id}`) names no file and would match everything,
// so only prefixes with something after the slash count.
function templatePrefixes(sources) {
  const prefixes = new Set();
  for (const source of sources) {
    for (const match of source.matchAll(TEMPLATE_PREFIX)) {
      if (match[1].startsWith('/') && match[1].length > 1) prefixes.add(match[1]);
    }
  }
  return [...prefixes];
}

/**
 * Finds files in public/ that no source refers to.
 *
 * A file `p` is used when a source contains `/p`, `p` or the basename of `p`,
 * or when a template literal's static prefix (see TEMPLATE_PREFIX) is a prefix
 * of `/p`. A folder name that merely occurs inside some other literal path is
 * not a wildcard.
 *
 * @param {string[]} files   paths relative to public/, separated by '/'
 * @param {string[]} sources source texts
 * @returns {string[]} sorted unused files
 */
export function findUnusedPublic(files, sources) {
  const prefixes = templatePrefixes(sources);
  return files
    .filter((file) => {
      const rooted = `/${file}`;
      const name = file.slice(file.lastIndexOf('/') + 1);
      if (prefixes.some((prefix) => rooted.startsWith(prefix))) return false;
      return !sources.some(
        (source) => source.includes(rooted) || source.includes(file) || source.includes(name),
      );
    })
    .sort();
}

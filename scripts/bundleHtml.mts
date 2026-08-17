import fs from 'fs';
import path from 'path';
import { minify } from 'html-minifier-terser';

(async () => {
  const outPath = path.join('dist', 'templates.min.html');
  fs.writeFileSync(outPath, '');
  await recurseTemplates('src', outPath);
})();

/** Walks dirPath recursively, minifying all `.template.html` files and appending them to outPath.
 *
 * @param {string} dirPath The directory to walk recursively.
 * @param {string} outPath The file to append minified HTML to. Will be created if it doesn't exist.
 */
async function recurseTemplates(dirPath: string, outPath: string) {
  const dirs = [];
  const dir = fs.opendirSync(dirPath);

  for await (const dirent of dir) {
    if (dirent.isFile()) {
      if (!dirent.name.endsWith('.template.html')) continue;
      if (dirent.name === 'templates.min.html') continue;

      await minifyAndAppend(path.join(dirPath, dirent.name), outPath);
    } else {
      dirs.push(path.join(dirPath, dirent.name));
    }
  }

  for (const d of dirs) {
    await recurseTemplates(d, outPath);
  }
}

/** Minifies a single HTML file and appends the result to outPath.
 *
 * @param {string} filePath The path to the HTML file to minify.
 * @param {string} outPath The file to append the minified HTML to.
 */
async function minifyAndAppend(filePath: string, outPath: string) {
  const templates = fs.readFileSync(filePath, 'utf-8');

  const minified = await minify(templates, {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    removeComments: true,
  });
  
  fs.appendFileSync(outPath, minified);
}

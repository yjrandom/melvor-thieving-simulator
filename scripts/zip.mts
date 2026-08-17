import { ZipArchive } from 'archiver';
import fs from 'fs';
import path from 'path';

import pkg from '../package.json' with { type: 'json' };

const dir = 'package';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const outname = `${pkg.name}_${pkg.version}.zip`;
const output = fs.createWriteStream(path.resolve(dir, outname));
const archive = new ZipArchive();

output.on('close', () => {
  console.log(outname + ': ' + archive.pointer() + ' total bytes');

  fs.readdir(dir, (err, files) => {
    if (err) {
      console.log(err);
    }

    files.forEach((file) => {
      if (file !== outname) {
        fs.rmSync(path.join(dir, file), { recursive: true, force: true });
      }
    });
  });
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory('dist/', false);
archive.finalize();

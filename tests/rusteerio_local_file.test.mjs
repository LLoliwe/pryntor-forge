import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, symlink, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readLocalHtmlFile, LIMITS } from '../tools/rusteerio_extract.mjs';

test('local reader uses a bounded no-follow file descriptor', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'pryntor-osie-html-'));
  try {
    const normal = join(dir, 'ordinary.html');
    const text = '<h1>Source attribution test</h1>';
    await writeFile(normal, text, 'utf8');
    assert.equal(await readLocalHtmlFile(normal), text);

    const alias = join(dir, 'replaced-symlink.html');
    await symlink(normal, alias);
    await assert.rejects(readLocalHtmlFile(alias), err =>
      err?.code === 'ELOOP' || /symlink|no-symlink|not permitted/i.test(err?.message || ''));

    const folder = join(dir, 'folder');
    await mkdir(folder);
    await assert.rejects(readLocalHtmlFile(folder), /regular HTML file/);

    const tooBig = join(dir, 'oversized.html');
    await writeFile(tooBig, Buffer.alloc(LIMITS.bytesPerPage + 1, 65));
    await assert.rejects(readLocalHtmlFile(tooBig), /2 MiB/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

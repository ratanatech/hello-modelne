/* node validate.test.js */
const assert = require('node:assert/strict');
const { validateFile, extensionOf, MAX_BYTES } = require('./validate.js');

const f = (name, size) => ({ name, size });

assert.equal(extensionOf('robot.GLB'), 'glb');
assert.equal(extensionOf('noext'), '');

assert.deepEqual(validateFile(f('robot.glb', 1024)), { ok: true });
assert.deepEqual(validateFile(f('robot.FBX', 1024)), { ok: true });

assert.equal(validateFile(f('robot.obj', 1024)).code, 'type');
assert.equal(validateFile(f('noext', 1024)).code, 'type');
assert.equal(validateFile(f('robot.glb', 0)).code, 'empty');
assert.equal(validateFile(f('robot.glb', MAX_BYTES + 1)).code, 'size');
assert.deepEqual(validateFile(f('robot.glb', MAX_BYTES)), { ok: true }, 'boundary is inclusive');

// every failure names a next action
for (const bad of [f('x.obj', 10), f('x.glb', 0), f('x.glb', MAX_BYTES + 1)]) {
  const r = validateFile(bad);
  assert.ok(r.message.length > 40, 'message explains what/why/next');
  assert.ok(validateFile(bad, 'id').message !== r.message, 'ID copy differs from EN');
}

// a file 1 byte over the limit must not read as "10.0MB over the 10MB limit"
{
  const m = validateFile(f('huge.glb', MAX_BYTES + 1)).message;
  assert.match(m, /10\.1MB/, 'file size rounds up');
  assert.match(m, /over the 10MB/, 'limit stays a round number');
}

// the browser entry point must exist too
assert.ok(globalThis.LeafTrackRules && globalThis.LeafTrackRules.validateFile,
  'attaches to the global for the <script src> path');

console.log('ok — dropzone rules');

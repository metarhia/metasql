'use strict';

const vm = require('vm');
const fs = require('fs').promises;

const SCRIPT_OPTIONS = { timeout: 5000 };

class Schema {
  constructor(schemaPath) {
    this.path = schemaPath;
    this.entity = null;
    return this.load();
  }

  async load() {
    try {
      const src = await fs.readFile(this.path, 'utf8');
      if (!src) return null;
      const script = new vm.Script(src, { filename: this.path });
      return script.runInThisContext(SCRIPT_OPTIONS);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(err.stack);
      }
    }
    return this;
  }
}

module.exports = { Schema };

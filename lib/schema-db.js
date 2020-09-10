'use strict';

const path = require('path');
const fs = require('fs').promises;

const { Schema } = require('./schema.js');

class DatabaseSchema {
  constructor(schemaPath) {
    this.path = schemaPath;
    this.entities = new Map();
    return this.load();
  }

  async load() {
    const files = await fs.readdir(this.path, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) continue;
      if (!file.name.endsWith('.js')) continue;
      const absPath = path.join(this.path, file.name);
      const schema = await new Schema(absPath);
      if (!schema) continue;
      const schemaName = path.basename(file.name, '.js');
      this.entities.set(schemaName, schema);
    }
    return this;
  }

  async preprocess() {
    for (const [name, entity] of this.entities) {
      await this.preprocessEntity(name, entity);
    }
  }

  async preprocessEntity(name, entity) {
    console.log('Preprocess metaschema');
    const args = `${name}, ${JSON.stringify(entity)}`;
    throw new Error(`Method is not implemented: preprocessEntity(${args})`);
  }

  async validate() {
    console.log('Validating metaschema');
    for (const [name, entity] of this.entities) {
      const fields = Object.keys(entity);
      if (entity) console.log(`  ${name}: ${fields.length} fields`);
    }
  }

  async generate(outputPath) {
    console.log('Generating SQL DDL script ' + outputPath);
    const script = [];
    for (const [name, entity] of this.entities) {
      const sql = await this.generateEntity(name, entity);
      script.push(sql);
    }
    const dbPath = path.join(outputPath, 'database.sql');
    await fs.writeFile(dbPath, script.join('\n\n') + '\n');
  }

  async generateEntity(name, entity) {
    const args = `${name}, ${JSON.stringify(entity)}`;
    throw new Error(`Method is not implemented: generateEntity(${args})`);
  }
}

module.exports = { DatabaseSchema };

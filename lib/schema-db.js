'use strict';

const path = require('path');
const fs = require('fs').promises;

const { isUpperCamel } = require('./utils.js');
const { Schema } = require('./schema.js');

class DatabaseSchema {
  constructor(schemaPath) {
    this.path = schemaPath;
    this.entities = new Map();
    this.order = new Set();
    this.database = null;
    return this.load();
  }

  async load() {
    const files = await fs.readdir(this.path, { withFileTypes: true });
    const dbPath = path.join(this.path, '.database.js');
    this.database = await new Schema(dbPath);
    for (const file of files) {
      if (file.isDirectory()) continue;
      if (!file.name.endsWith('.js')) continue;
      if (file.name.startsWith('.')) continue;
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
    for (const [name, entity] of this.entities) {
      if (!this.order.has(name)) {
        await this.reorderEntity(name, entity);
      }
    }
  }

  async preprocessEntity(name, entity) {
    console.log('Preprocess metaschema');
    const args = `${name}, ${JSON.stringify(entity)}`;
    throw new Error(`Method is not implemented: preprocessEntity(${args})`);
  }

  async reorderEntity(name, entity) {
    const fields = Object.keys(entity);
    for (const field of fields) {
      const { type } = entity[field];
      if (isUpperCamel(type) && !this.order.has(type)) {
        await this.reorderEntity(type, this.entities.get(type));
      }
    }
    this.order.add(name);
  }

  async validate() {
    console.log('Validating metaschema');
    for (const name of this.order) {
      const entity = this.entities.get(name);
      const fields = Object.keys(entity);
      if (entity) console.log(`  ${name}: ${fields.length} fields`);
    }
  }

  async generate(outputPath) {
    console.log('Generating SQL DDL script ' + outputPath);
    const script = [];
    for (const name of this.order) {
      const entity = this.entities.get(name);
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

  async getPreviousSchema() {
    const historyPath = path.join(this.path, '.history');
    const folders = await fs.readdir(historyPath, { withFileTypes: true });
    let version = 0;
    let previousName = '';
    for (const folder of folders) {
      if (!folder.isDirectory()) continue;
      const { name } = folder;
      const v = parseInt(name.substring(name.indexOf('v') + 1), 10);
      if (v > version) {
        version = v;
        previousName = folder.name;
      }
    }
    if (version === 0) return null;
    const previousPath = path.join(historyPath, previousName);
    return new DatabaseSchema(previousPath);
  }

  async migrate() {
    const { name, driver, version } = this.database;
    const now = new Date().toISOString().substring(0, 10);
    console.log(`Migration ${driver} database: ${name} v${version} (${now})`);
    const ps = await this.getPreviousSchema();
    if (!ps) {
      console.log('Previous schema is not found in ../.history');
      return;
    }
    const folder = path.basename(ps.path);
    const date = folder.substring(0, folder.lastIndexOf('v') - 1);
    console.log(`Previous schema: v${ps.database.version} (${date})`);
    const newFolder = path.join(this.path, `.history/${date}-v${version}`);
    const mig = path.join(this.path, `.migration/${date}-v${version}`);
    const migUp = mig + '-up.sql';
    const migDn = mig + '-dn.sql';
    console.log(`Save history: ${newFolder}`);
    console.log(`Migration up: ${migUp}`);
    console.log(`Migration down: ${migDn}`);
  }
}

module.exports = { DatabaseSchema };

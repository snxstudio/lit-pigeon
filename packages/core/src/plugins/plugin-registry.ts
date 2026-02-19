import type { PigeonPlugin, Command } from '../types/editor.js';
import { registerBlock } from '../schema/block-registry.js';

export class PluginRegistry {
  private _plugins: Map<string, PigeonPlugin> = new Map();

  register(plugin: PigeonPlugin): void {
    if (this._plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }

    this._plugins.set(plugin.name, plugin);

    // Register any custom blocks
    if (plugin.blocks) {
      for (const block of plugin.blocks) {
        registerBlock(block);
      }
    }
  }

  unregister(name: string): void {
    this._plugins.delete(name);
  }

  get(name: string): PigeonPlugin | undefined {
    return this._plugins.get(name);
  }

  getAll(): PigeonPlugin[] {
    return Array.from(this._plugins.values());
  }

  getCommands(): Record<string, Command> {
    const commands: Record<string, Command> = {};
    for (const plugin of this._plugins.values()) {
      if (plugin.commands) {
        Object.assign(commands, plugin.commands);
      }
    }
    return commands;
  }

  has(name: string): boolean {
    return this._plugins.has(name);
  }
}

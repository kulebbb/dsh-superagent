import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { name, VERSION } from '../src/index.ts'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')

describe('bundle manifest', () => {
  it('declares a DSH bundle with its patch and client entry', () => {
    expect(pkg.dsh.bundle.patch).toBe('./cordis.patch.yml')
    expect(pkg.dsh.manifestVersion).toBe(1)
    expect(pkg.exports['./client']).toBe('./lib/client.js')
    expect(pkg.files).toContain('cordis.patch.yml')
  })
  it('targets the DSH 0.2.1-rc.5 line', () => {
    expect(pkg.engines.dsh).toBe('^0.2.1-rc.5')
    for (const [dep, version] of Object.entries(pkg.devDependencies as Record<string, string>)) {
      if (dep.startsWith('@deepseek-ai/dsh-')) expect(version, dep).toBe('0.2.1-rc.5')
    }
  })
  it('inserts the plugin under the package name, and the version matches', () => {
    expect(name).toBe(pkg.name)
    expect(patch).toContain(`name: ${pkg.name}`)
    expect(VERSION).toBe(pkg.version)
  })
})

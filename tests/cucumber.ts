import { resolve } from 'node:path'
import { Cli } from '@cucumber/cucumber'

const cli = new Cli({ argv: process.argv, cwd: process.cwd(), stdout: process.stdout, stderr: process.stderr, paths: [resolve('tests/features/**/*.feature')], require: [resolve('tests/steps/**/*.ts')], format: ['progress'] })

cli.run().then((result) => {
  process.exitCode = result.success ? 0 : 1
})

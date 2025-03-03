import { type WriteStream, accessSync, createWriteStream, mkdirSync, writeFileSync } from 'node:fs'
import { dirname as directoryname } from 'node:path'

export class FileLogger {
  readonly #filename: string
  readonly #dirname: string
  private writableStream: WriteStream
  constructor(filename: string) {
    this.#dirname = directoryname(filename)
    this.#filename = filename
    this.#_stat()
    this.#_createWritableStream()
    this.#_endStream()
  }

  #fsAccess(filename: string, mode?: number) {
    try {
      accessSync(filename, mode)
      return true
    } catch (error) {
      return false
    }
  }

  #_stat() {
    //check if file exists
    if (!this.#fsAccess(this.#filename)) {
      // check if directory exists
      if (!this.#fsAccess(this.#dirname)) {
        // create the directory
        mkdirSync(this.#dirname, { recursive: true })
      }
      // create the file and write an empty string to it
      writeFileSync(this.#filename, '')
      return
    }
  }

  #_createWritableStream() {
    this.writableStream = createWriteStream(this.#filename, { flags: 'a' })
  }

  toFile(stringToLog: string) {
    this.writableStream.write(`${stringToLog}\n`)
  }

  #_endStream() {
    process.on('exit', () => {
      this.writableStream.close()
    })

    process.on('SIGTERM', () => {
      this.writableStream.close()
      process.exit(0)
    })

    process.on('SIGINT', () => {
      this.writableStream.close()
      process.exit(0)
    })

    process.on('uncaughtException', () => {
      this.writableStream.close()
      process.exit(1)
    })
  }
}

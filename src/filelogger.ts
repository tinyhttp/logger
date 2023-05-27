import {
  accessSync,
  constants as fsConstants,
  writeFileSync,
  createWriteStream,
  WriteStream,
  mkdirSync
} from 'fs'
import { dirname as directoryname } from 'path'



export class FileLogger {
  readonly #filename: string
  readonly #dirname: string
  private writableStream: WriteStream
  constructor(filename: string) {
    this.#dirname = directoryname(filename)
    this.#filename = filename
    this.#_stat()
    this.#_createWritableStream()
  }

  #fsAccess(filename: string, mode: number){
    try {
      accessSync(filename, mode);
      return true;
    } catch (error) {
      return false;
    }
  }

  #_stat() {
    //check if file exists
    if (!this.#fsAccess(this.#filename, fsConstants.W_OK)) {
      // check if directory exists
      if (!this.#fsAccess(this.#dirname, fsConstants.W_OK)) {
        mkdirSync(this.#dirname, { recursive: true, mode: fsConstants.W_OK })
      }         
      writeFileSync(this.#filename, '')
      return
    }
  }

  #_createWritableStream() {
    this.writableStream = createWriteStream(this.#filename, { flags: 'a' })
  }

  toFile(stringToLog: string) {
    this.writableStream.write(stringToLog + '\n')
  }

  #_endStream() {
    process.on('exit', (code) => {
      this.writableStream.close()
    })

    process.on('SIGTERM', (signal) => {
      this.writableStream.close()
      process.exit(0)
    })

    process.on('SIGINT', (signal) => {
      this.writableStream.close()
      process.exit(0)
    })

    process.on('uncaughtException', (err) => {
      this.writableStream.close()
      process.exit(1)
    })
  }
}

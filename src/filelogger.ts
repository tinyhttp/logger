import {
  existsSync,
  accessSync,
  constants as fsConstants,
  writeFileSync,
  createWriteStream,
  WriteStream,
  mkdirSync
} from 'fs'
import { dirname as directoryname } from 'path'

export class FileLogger {
  private readonly filename: string
  private readonly dirname: string
  private writableStream: WriteStream
  constructor(filename: string) {
    this.dirname = directoryname(filename)
    this.filename = filename
    this._stat()
    this._createWritableStream()
  }

  private _stat() {
    //check if file exists
    if (existsSync(this.filename)) {
      try {
        // check for permissions
        accessSync(this.filename)
        return
      } catch (error) {
        throw new Error('Unable to read file. Check for permissions!')
      }
    } else {
      // check if directory exists
      try {
        accessSync(this.dirname)
      } catch (error) {
        mkdirSync(this.dirname, { recursive: true, mode: fsConstants.W_OK })
      }
      writeFileSync(this.filename, '')
      return
    }
  }

  private _createWritableStream() {
    this.writableStream = createWriteStream(this.filename, { flags: 'a' })
  }

  toFile(stringToLog: string) {
    this.writableStream.write(stringToLog + '\n')
  }

  private _endStream() {
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

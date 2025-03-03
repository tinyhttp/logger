import { METHODS, type IncomingMessage as Request, type ServerResponse as Response } from 'node:http'
import { bold, cyan, magenta, red } from 'colorette'
import dayjs from 'dayjs'
import statusEmoji from 'http-status-emojis'
import { FileLogger } from './filelogger.js'

export enum LogLevel {
  error = 'error',
  warn = 'warn',
  trace = 'trace',
  info = 'info',
  log = 'log'
}

export type LoggerOptions = Partial<{
  methods: string[]
  output: {
    color: boolean
    filename?: string
    callback: (string: string) => void
    level?: LogLevel
  }
  timestamp: boolean | { format?: string }
  emoji: boolean
  ip: boolean
  ignore: string[]
}>

const compileArgs = (
  args: (string | number)[],
  req: Request & Partial<{ originalUrl: string; ip: string }>,
  res: Response,
  options: LoggerOptions = {},
  status?: string,
  msg?: string
) => {
  const { method } = req
  const { statusCode } = res
  const url = req.originalUrl || req.url
  const methods = options.methods ?? METHODS
  const timestamp = options.timestamp ?? false
  const emojiEnabled = options.emoji
  const level = options.output?.level ? options.output.level : null
  if (level) args.push(`[${level.toUpperCase()}]`)

  if (methods.includes(method) && timestamp) {
    args.push(
      `${dayjs()
        .format(typeof timestamp !== 'boolean' && timestamp.format ? timestamp.format : 'HH:mm:ss')
        .toString()} - `
    )
  }

  if (options.ip) args.push(req.ip)

  if (emojiEnabled) args.push(statusEmoji[statusCode])

  args.push(method)

  args.push(status || res.statusCode)
  args.push(msg || res.statusMessage)
  args.push(url)
}

export const logger = (options: LoggerOptions = {}) => {
  const methods = options.methods ?? METHODS
  const ignore = options.ignore ?? []
  const output = options.output ?? { callback: console.log, color: true, level: null }
  let filelogger = null
  if (options.output?.filename) {
    filelogger = new FileLogger(options.output.filename)
  }
  return (req: Request, res: Response, next?: () => void) => {
    res.on('finish', () => {
      const args: (string | number)[] = []

      if (methods.includes(req.method) && !ignore.some((url) => req.url.startsWith(url))) {
        const s = res.statusCode.toString()
        let stringToLog = ''
        if (!output.color) {
          compileArgs(args, req, res, options)
          const m = args.join(' ')
          stringToLog = m
        } else {
          switch (s[0]) {
            case '2':
              compileArgs(args, req, res, options, cyan(bold(s)), cyan(res.statusMessage))
              stringToLog = args.join(' ')
              break
            case '4':
              compileArgs(args, req, res, options, red(bold(s)), red(res.statusMessage))
              stringToLog = args.join(' ')
              break
            case '5':
              compileArgs(args, req, res, options, magenta(bold(s)), magenta(res.statusMessage))
              stringToLog = args.join(' ')
              break
          }
        }
        output.callback(stringToLog)
        if (filelogger) {
          filelogger.toFile(stringToLog)
        }
      }
    })

    next?.()
  }
}

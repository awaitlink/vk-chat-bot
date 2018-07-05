require('colors')

export var types = {
  progress: ':',
  information: 'i',
  warning: '!',
  response: '<',
  error: '!!'
}

export default function log (type, text) {
  if (text === '') {
    return
  }

  if (process.env.TEST_MODE && type !== types.error) {
    return
  }

  var message = `[${type}] ${text}`

  switch (type) {
    case types.progress:
      message = message.cyan
      break
    case types.information:
      message = message.green
      break
    case types.warning:
      message = message.yellow
      break
    case types.error:
      message = message.red
      throw new Error(message)
  }

  console.log(message)
}

export function info (info) {
  log(types.information, info)
}

export function progress (info) {
  log(types.progress, info)
}

export function warn (info) {
  if (info instanceof Error) {
    info = info.message
  }

  log(types.warning, info)
}

export function error (reason) {
  if (reason instanceof Error) {
    reason = reason.message
  }

  if (!process.env.TEST_MODE) {
    var note = `[⋅] An error occured. The messages below may contain
[⋅] useful information about the problem.
[⋅] If you believe this is vk-chat-bot's fault,
[⋅] please report the issue at <https://github.com/u32i64/vk-chat-bot/issues>.`.inverse

    console.log(`\n\n${note}\n\n`)
  }

  log(types.error, reason)
}

export function response (info) {
  log(types.response, info)
}

export function requireParam (functionName, param, name) {
  if (!param) {
    if (name) {
      error(`In function '${functionName}': expected: '${name}', got: '${param}'.`)
    } else {
      error(`Bad parameter for function '${functionName}': '${param}'.`)
    }
  }
}

export function requireFunction (param) {
  if (typeof param !== 'function') {
    error(`Callback function that you specified is not a function.`)
  }
}

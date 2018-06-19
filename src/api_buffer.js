const log = new (require('./log.js'))()

class APIBuffer {
  constructor (api, eventType, object, message) {
    this.api = api
    this.obj = object
    this.msg = message
    this.eventType = eventType

    this.clear()
  }

  setPid (pid) {
    this.pid = pid
  }

  text (txt) {
    this.replyText = txt
  }

  attach (type, ownerId, resId) {
    log.requireParams('APIBuffer.attach', type, ownerId, resId)
    this.attachment.push(`${type}${ownerId}_${resId}`)
  }

  send () {
    if (this.eventType === 'message_deny') {
      log.log(log.type.information, `No message was sent to peer ${this.pid} ("message_deny" event)`)
      return
    }

    if (this.replyText === '' && this.attachment === []) {
      log.log(log.type.information, `No message was sent to peer ${this.pid} (text or attachment is required)`)
      return
    }

    var attachmentList = this.attachment.join(',')
    this.api.send(this.pid, this.replyText, attachmentList)
  }

  clear () {
    this.replyText = ''
    this.attachment = []

    if (this.eventType === 'message_allow') {
      this.pid = this.obj.user_id
    } else {
      this.pid = this.obj.peer_id
    }
  }
}

module.exports = APIBuffer

const log = new (require('./log.js'))()

class APIBuffer {
  constructor (api, eventType, object, message) {
    this.api = api
    this.obj = object
    this.msg = message
    this.eventType = eventType

    this.uid = this.obj.user_id

    this.replyText = ''
    this.attachment = []
  }

  setUid (uid) {
    this.uid = uid
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
      log.log(log.type.information, `No message was sent to user ${this.uid} ("message_deny" event)`)
      return
    }

    if (this.replyText === '' && this.attachment === []) {
      log.log(log.type.information, `No message was sent to user ${this.uid} (text or attachment is required)`)
      return
    }

    var attachmentList = this.attachment.join(',')
    this.api.send(this.uid, this.replyText, attachmentList)
  }

  clear () {
    this.replyText = ''
    this.attachment = []
    this.uid = this.obj.user_id
  }
}

module.exports = APIBuffer

const log = new (require('./log.js'))()

class APIBuffer {
  constructor (api, eType, obj, msg) {
    this.api = api
    this.obj = obj
    this.msg = msg
    this.eventType = eType

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

    var attachmentList = ''

    if (this.attachment !== []) {
      this.attachment.forEach(e => { attachmentList += e + ',' })
      attachmentList = attachmentList.substr(0, attachmentList.length - 1)
    }

    this.api.send(this.uid, this.replyText, attachmentList)
  }

  clear () {
    this.replyText = ''
    this.attachment = []
    this.uid = this.obj.user_id
  }
}

module.exports = APIBuffer

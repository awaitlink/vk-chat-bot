const log = new (require('./log.js'))()

class APIBuffer {
  constructor (api, eType, obj, msg) {
    this.api = api
    this.obj = obj
    this.msg = msg
    this.eventType = eType

    this.uid = this.obj.user_id

    this.replyText = null
  }

  setUid (uid) {
    this.uid = uid
  }

  text (txt) {
    this.replyText = txt
  }

  send () {
    if (this.eventType === 'message_deny') {
      log.log(log.type.information, `No message was sent to user ${this.uid} ("message_deny" event)`)
      return
    }

    if (!this.replyText) {
      log.log(log.type.information, `No message was sent to user ${this.uid} (text is empty)`)
      return
    }

    this.api.send(this.uid, this.replyText)
  }

  clear () {
    this.replyText = null
    this.uid = this.obj.user_id
  }
}

module.exports = APIBuffer

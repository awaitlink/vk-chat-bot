import {warn, requireParam} from '../extra/log'
import '@babel/polyfill'

export default class Context {
  constructor (api, eventType, object, message) {
    this.api = api
    this.obj = object
    this.msg = message
    this.eventType = eventType

    this.autoSend = true

    this.clear()
  }

  noAutoSend () {
    this.autoSend = false
  }

  setPid (pid) {
    this.pid = pid
  }

  text (txt) {
    this.replyText = txt
  }

  attach (type, ownerId, resId, accessKey) {
    requireParam('Context.attach', type, 'attachment type')
    requireParam('Context.attach', ownerId, 'owner id')
    requireParam('Context.attach', resId, 'resource id')

    if (accessKey) {
      this.attachment.push(`${type}${ownerId}_${resId}_${accessKey}`)
    } else {
      this.attachment.push(`${type}${ownerId}_${resId}`)
    }
  }

  async send () {
    if (this.eventType === 'message_deny') {
      warn(`No message was sent to peer ${this.pid} ("message_deny" event)`)
      return
    }

    if (this.replyText === '' && this.attachment === []) {
      warn(`No message was sent to peer ${this.pid} (text or attachment is required)`)
      return
    }

    var attachmentList = this.attachment.join(',')
    return this.api.send(this.pid, this.replyText, attachmentList)
  }

  clear () {
    this.replyText = ''
    this.attachment = []

    if (this.eventType === 'message_allow') {
      this.pid = this.obj.user_id
    } else if (this.eventType === 'message_typing_state') {
      this.pid = this.obj.from_id
    } else {
      this.pid = this.obj.peer_id
    }
  }
}

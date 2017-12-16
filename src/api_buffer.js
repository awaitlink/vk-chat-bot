const log = new (require('./log.js'))();

class APIBuffer {
  constructor(api, eType, obj, msg) {
    this.api = api;
    this.obj = obj;
    this.msg = msg;
    this.eventType = eType;
    this.replyText = null;
  }

  text(txt) {
    this.replyText = txt;
  }

  send() {
    var uid = this.obj.user_id;

    if (this.eventType === "message_deny") {
      log.log(log.type.information, `No message was sent to user ${uid} ("message_deny" event)`);
      return;
    }

    if (!this.replyText) {
      log.log(log.type.information, `No message was sent to user ${uid} (text is empty)`);
      return;
    }

    this.api.send(uid, this.replyText);
    this.clear();
  }

  clear() {
    this.replyText = null;
  }
}

module.exports = APIBuffer;

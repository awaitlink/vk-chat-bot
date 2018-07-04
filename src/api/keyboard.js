export class Keyboard {
  constructor (items = [], oneTime = false) {
    this.oneTime = oneTime
    this.items = items
  }

  getJSON () {
    var json = {
      'one_time': this.oneTime,
      'buttons': this.items
    }

    return json
  }
}

export class Button {
  constructor (label = 'Button', color = 'default', payload = '') {
    this.action = {
      'type': 'text',
      'label': label.toString()
    }
    this.color = color

    if (payload) {
      this.action.payload = JSON.stringify(payload)
    }
  }
}

export var colors = {
  primary: 'primary',
  default: 'default',
  negative: 'negative',
  positive: 'positive'
}

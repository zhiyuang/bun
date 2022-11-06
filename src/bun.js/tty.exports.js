const { Duplex } = import.meta.require('node:stream');

function isTTY(fd) {
  return true;
}

function isatty(fd) {
  return Number.isInteger(fd) && fd >= 0 && fd <= 2147483647 &&
         isTTY(fd);
}

class ReadStream extends Duplex {
  constructor(options) {
    super(options);
    this.isRaw = false;
    this.isTTY = true;
  }

  setRawMode() {

  }
}

class WriteStream extends Duplex {
  constructor(options) {
    super(options);
    this.isTTY = true;
  }

  getColorDepth() {

  }

  hasColors() {

  }

  _refreshSize() {

  }
}

export default { isatty, ReadStream, WriteStream };

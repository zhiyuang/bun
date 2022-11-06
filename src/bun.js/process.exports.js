function guessHandleType(fd) {
  return 'TTY'
}

function createWritableStdioStream(fd) {
  let stream;
  switch (guessHandleType(fd)) {
    case 'TTY': {
      const tty = import.meta.require('node:tty');
      stream = new tty.WriteStream(fd);
      stream._type = 'tty';
      break;
    }
  }

  stream.fd = fd;
  stream._isStdio = true;
  return stream;
}

let _stdout;
let _stdin;

function getStdout() {
  if (_stdout) return _stdout;
  _stdout = createWritableStdioStream(1);
  _stdout.destroySoon = _stdout.destroy;
  return _stdout;
}

function getStdin() {
  if (_stdin) return _stdin;
  const fd = 0;
  switch (guessHandleType(fd)) {
    case 'TTY': {
      const tty = import.meta.require('node:tty');
      _stdin = new tty.ReadStream(fd);
      break;
    }
  }

  _stdin.fd = fd;

  // `_stdin` starts out life in a paused state, but node doesn't
  // know yet. Explicitly to readStop() it to put it in the
  // not-reading state.
  if (_stdin._handle && _stdin._handle.readStop) {
    _stdin._handle.reading = false;
    _stdin._readableState.reading = false;
    _stdin._handle.readStop();
  }

  // If the user calls _stdin.pause(), then we need to stop reading
  // once the stream implementation does so (one nextTick later),
  // so that the process can close down.
  _stdin.on('pause', () => {
    process.nextTick(onpause);
  });

  function onpause() {
    if (!_stdin._handle)
      return;
    if (_stdin._handle.reading && !_stdin.readableFlowing) {
      _stdin._readableState.reading = false;
      _stdin._handle.reading = false;
      _stdin._handle.readStop();
    }
  }

  addCleanup(function cleanupStdin() {
    _stdin.destroy();
    _stdin = undefined;
  });
  // No need to add deserialize callback because _stdin = undefined above
  // causes the stream to be lazily initialized again later.
  return _stdin;
}

Object.defineProperty(process, "_stdin", {
  __proto__: null,
  configurable: true,
  enumerable: true,
  get: getStdin
});

Object.defineProperty(process, "_stdout", {
  __proto__: null,
  configurable: true,
  enumerable: true,
  get: getStdout
});

export const stdin = getStdin();
export const stdout = getStdout();

process.stdin = stdin;
process.stdout = stdout;

export default process;

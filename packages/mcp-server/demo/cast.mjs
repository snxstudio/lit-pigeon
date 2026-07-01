// Minimal asciinema v2 cast builder.
// Accumulates timed terminal output and serialises to the .cast JSON-lines format
// (https://docs.asciinema.org/manual/asciicast/v2/). No external deps.

const ESC = '[';
export const c = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  gray: `${ESC}90m`,
};

export class Cast {
  constructor({ width = 96, height = 30, title = 'lit-pigeon demo' } = {}) {
    this.width = width;
    this.height = height;
    this.title = title;
    this.t = 0; // virtual clock (seconds)
    this.events = [];
  }

  // advance the clock without output
  pause(seconds) {
    this.t += seconds;
    return this;
  }

  // emit a chunk of output instantly (after an optional lead pause)
  out(text, lead = 0) {
    if (lead) this.t += lead;
    this.events.push([round(this.t), 'o', text]);
    return this;
  }

  // print a full line instantly
  line(text = '', lead = 0.05) {
    return this.out(`${text}\r\n`, lead);
  }

  // typewriter effect, char by char
  type(text, { cps = 32, lead = 0.2 } = {}) {
    if (lead) this.t += lead;
    const delay = 1 / cps;
    for (const ch of text) {
      this.t += delay * (ch === ' ' ? 0.6 : 1);
      this.events.push([round(this.t), 'o', ch]);
    }
    return this;
  }

  serialize() {
    const header = {
      version: 2,
      width: this.width,
      height: this.height,
      title: this.title,
      env: { TERM: 'xterm-256color', SHELL: '/bin/zsh' },
    };
    return [JSON.stringify(header), ...this.events.map((e) => JSON.stringify(e))].join('\n') + '\n';
  }
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

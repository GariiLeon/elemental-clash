export class Vector {
  constructor(x, y) {
    this.x = isNaN(x) ? 0 : x;
    this.y = isNaN(y) ? 0 : y;
  }

  set(x, y) {
    this.x = isNaN(x) ? 0 : x;
    this.y = isNaN(y) ? 0 : y;
  }

  add(v) {
    this.x += isNaN(v) ? v.x : v;
    this.y += isNaN(v) ? v.y : v;
    return this;
  }

  sub(v) {
    this.x -= isNaN(v) ? v.x : v;
    this.y -= isNaN(v) ? v.y : v;
    return this;
  }

  mult(v) {
    this.x *= isNaN(v) ? v.x : v;
    this.y *= isNaN(v) ? v.y : v;
    return this;
  }

  div(v) {
    this.x /= isNaN(v) ? v.x : v;
    this.y /= isNaN(v) ? v.y : v;
    return this;
  }

  clone() {
    return new Vector(this.x, this.y);
  }

  dist(v) {
    let dx = this.x - v.x;
    let dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  clamp(min, max) {
    this.x = Math.min(Math.max(this.x, min), max);
    this.y = Math.min(Math.max(this.y, min), max);
    return this;
  }

  setMag(n) {
    return this.normalize().mult(n);
  }

  normalize() {
    const len = this.mag();
    // here we multiply by the reciprocal instead of calling 'div()'
    // since div duplicates this zero check.
    if (len !== 0) this.mult(1 / len);
    return this;
  }

  limit(max) {
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq)) //normalize it
        .mult(max);
    }
    return this;
  }

  mag() {
    return Math.sqrt(this.magSq());
  }

  magSq() {
    const x = this.x;
    const y = this.y;
    return x * x + y * y;
  }
}

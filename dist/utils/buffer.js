"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (!ArrayBuffer.transfer) {
    ArrayBuffer.transfer = (source, length) => {
        if (!(source instanceof ArrayBuffer))
            throw new TypeError('Source must be an instance of ArrayBuffer');
        if (length <= source.byteLength)
            return source.slice(0, length);
        const sourceView = new Uint8Array(source);
        const destView = new Uint8Array(new ArrayBuffer(length));
        destView.set(sourceView);
        return destView.buffer;
    };
}
/**
 * A little-endian byte buffer class.
 */
class Buffer {
    constructor() {
        this._capacity = 32;
        this.cursor = 0;
        this._written = 0;
        this._buffer = new ArrayBuffer(this._capacity);
        this._view = new DataView(this._buffer);
    }
    maybeExpand(n) {
        if (this.cursor + n < this._capacity) {
            return;
        }
        while (this.cursor + n >= this._capacity) {
            this._capacity *= 2;
        }
        this._buffer = ArrayBuffer.transfer(this._buffer, this._capacity);
        this._view = new DataView(this._buffer);
    }
    updateWritten() {
        this._written = Math.max(this._written, this.cursor);
    }
    get(signed, s) {
        const r = this._view[`get${signed ? 'I' : 'Ui'}nt${s}`](this.cursor, true);
        this.cursor += s / 8;
        return r;
    }
    getI(s) {
        return this.get(true, s);
    }
    getU(s) {
        return this.get(false, s);
    }
    getF(s) {
        const r = this._view[`getFloat${s}`](this.cursor, true);
        this.cursor += s / 8;
        return r;
    }
    put(n, signed, s) {
        this.maybeExpand(s / 8);
        this._view[`set${signed ? 'I' : 'Ui'}nt${s}`](this.cursor, n, true);
        this.cursor += s / 8;
        this.updateWritten();
    }
    putI(s, n) {
        this.put(n, true, s);
    }
    putU(s, n) {
        this.put(n, false, s);
    }
    putF(s, n) {
        this.maybeExpand(s / 8);
        this._view[`setFloat${s}`](this.cursor, n, true);
        this.cursor += s / 8;
        this.updateWritten();
    }
    putA(a) {
        this.maybeExpand(a.byteLength);
        new Uint8Array(this._buffer, this.cursor, a.byteLength).set(a);
        this.cursor += a.byteLength;
        this.updateWritten();
    }
    align(n) {
        const rem = this.cursor % n;
        if (rem === 0) {
            return;
        }
        this.cursor += n - rem;
    }
    asArray() {
        return new Uint8Array(this._buffer.slice(0, this._written));
    }
    get written() {
        return this._written;
    }
}
exports.default = Buffer;
//# sourceMappingURL=buffer.js.map
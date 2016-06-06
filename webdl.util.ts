

export class Graph {
  step_horizon:any
  pts:any
  maxy:any
  miny:any
  constructor(options:any) {
    var options = options || {};

    this.step_horizon = options.step_horizon || 1000;
    this.pts = [];
    this.maxy = -9999;
    this.miny = 9999;
  }
  add(step, y) {
    var time = new Date().getTime(); // in ms
    if (y > this.maxy * 0.99) this.maxy = y * 1.05;
    if (y < this.miny * 1.01) this.miny = y * 0.95;
    this.pts.push({ step: step, time: time, y: y });
    if (step > this.step_horizon) { this.step_horizon *= 2; }
  }
  drawSelf(canv) {
    var pad = 25;
    var H = canv.height;
    var W = canv.width;
    var ctx = canv.getContext('2d');

    ctx.clearRect(0, 0, W, H);
    ctx.font = "10px Georgia";

    var f2t = function(x) {
      var dd = 1.0 * Math.pow(10, 2);
      return '' + Math.floor(x * dd) / dd;
    }

    // draw guidelines and values
    ctx.strokeStyle = "#999";
    ctx.beginPath();
    var ng = 10;
    for (var i = 0; i <= ng; i++) {
      var xpos = i / ng * (W - 2 * pad) + pad;
      ctx.moveTo(xpos, pad);
      ctx.lineTo(xpos, H - pad);
      ctx.fillText(f2t(i / ng * this.step_horizon / 1000) + 'k', xpos, H - pad + 14);
    }
    for (var i = 0; i <= ng; i++) {
      var ypos = i / ng * (H - 2 * pad) + pad;
      ctx.moveTo(pad, ypos);
      ctx.lineTo(W - pad, ypos);
      ctx.fillText(f2t((ng - i) / ng * (this.maxy - this.miny) + this.miny), 0, ypos);
    }
    ctx.stroke();

    var N = this.pts.length;
    if (N < 2) return;

    // draw the actual curve
    var t = function(x, y, s) {
      var tx = x / s.step_horizon * (W - pad * 2) + pad;
      var ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad);
      return { tx: tx, ty: ty }
    }

    ctx.strokeStyle = "red";
    ctx.beginPath()
    for (var i = 0; i < N; i++) {
      // draw line from i-1 to i
      var p = this.pts[i];
      var pt = t(p.step, p.y, this);
      if (i === 0) ctx.moveTo(pt.tx, pt.ty);
      else ctx.lineTo(pt.tx, pt.ty);
    }
    ctx.stroke();
  }
}


export class MultiGraph {

  step_horizon
  pts
  maxy
  miny
  numlines
  legend
  styles
  maxy_forced
  miny_forced

  constructor(legend, options) {
    var options = options || {};
    this.step_horizon = options.step_horizon || 1000;

    if (typeof options.maxy !== 'undefined') this.maxy_forced = options.maxy;
    if (typeof options.miny !== 'undefined') this.miny_forced = options.miny;

    this.pts = [];

    this.maxy = -9999;
    this.miny = 9999;
    this.numlines = 0;

    this.numlines = legend.length;
    this.legend = legend;
    this.styles = ["red", "blue", "green", "black", "magenta", "cyan", "purple", "aqua", "olive", "lime", "navy"];
    // 17 basic colors: aqua, black, blue, fuchsia, gray, green, lime, maroon, navy, olive, orange, purple, red, silver, teal, white, and yellow
  }

  add(step, yl) {
    var time = new Date().getTime(); // in ms
    var n = yl.length;
    for (var k = 0; k < n; k++) {
      var y = yl[k];
      if (y > this.maxy * 0.99) this.maxy = y * 1.05;
      if (y < this.miny * 1.01) this.miny = y * 0.95;
    }

    if (typeof this.maxy_forced !== 'undefined') this.maxy = this.maxy_forced;
    if (typeof this.miny_forced !== 'undefined') this.miny = this.miny_forced;

    this.pts.push({ step: step, time: time, yl: yl });
    if (step > this.step_horizon) this.step_horizon *= 2;
  }

  drawSelf(canv) {

    var pad = 25;
    var H = canv.height;
    var W = canv.width;
    var ctx = canv.getContext('2d');

    ctx.clearRect(0, 0, W, H);
    ctx.font = "10px Georgia";

    var f2t = function(x) {
      var dd = 1.0 * Math.pow(10, 2);
      return '' + Math.floor(x * dd) / dd;
    }

    // draw guidelines and values
    ctx.strokeStyle = "#999";
    ctx.beginPath();
    var ng = 10;
    for (var i = 0; i <= ng; i++) {
      var xpos = i / ng * (W - 2 * pad) + pad;
      ctx.moveTo(xpos, pad);
      ctx.lineTo(xpos, H - pad);
      ctx.fillText(f2t(i / ng * this.step_horizon / 1000) + 'k', xpos, H - pad + 14);
    }
    for (var i = 0; i <= ng; i++) {
      var ypos = i / ng * (H - 2 * pad) + pad;
      ctx.moveTo(pad, ypos);
      ctx.lineTo(W - pad, ypos);
      ctx.fillText(f2t((ng - i) / ng * (this.maxy - this.miny) + this.miny), 0, ypos);
    }
    ctx.stroke();

    var N = this.pts.length;
    if (N < 2) return;

    // draw legend
    for (var k = 0; k < this.numlines; k++) {
      ctx.fillStyle = this.styles[k % this.styles.length];
      ctx.fillText(this.legend[k], W - pad - 100, pad + 20 + k * 16);
    }
    ctx.fillStyle = "black";

    // draw the actual curve
    var t = function(x, y, s) {
      var tx = x / s.step_horizon * (W - pad * 2) + pad;
      var ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad);
      return { tx: tx, ty: ty }
    }
    for (var k = 0; k < this.numlines; k++) {

      ctx.strokeStyle = this.styles[k % this.styles.length];
      ctx.beginPath()
      for (var i = 0; i < N; i++) {
        // draw line from i-1 to i
        var p = this.pts[i];
        var pt = t(p.step, p.yl[k], this);
        if (i === 0) ctx.moveTo(pt.tx, pt.ty);
        else ctx.lineTo(pt.tx, pt.ty);
      }
      ctx.stroke();
    }
  }
}
export class windows {
  v
  size
  minsize
  sum
  constructor(size, minsize) {
    this.v = [];
    this.size = typeof (size) === 'undefined' ? 100 : size;
    this.minsize = typeof (minsize) === 'undefined' ? 20 : minsize;
    this.sum = 0;
  }
  add(x) {
    this.v.push(x);
    this.sum += x;
    if (this.v.length > this.size) {
      var xold = this.v.shift();
      this.sum -= xold;
    }
  }
  get_average() {
    if (this.v.length < this.minsize) return -1;
    else return this.sum / this.v.length;
  }
  reset(x) {
    this.v = [];
    this.sum = 0;
  }
}


export function f2t(x, d) {

  if (typeof (d) === 'undefined') { d = 5; }
  var dd = 1.0 * Math.pow(10, d);
  return '' + Math.floor(x * dd) / dd;

}


let return_v = false;
let v_val = 0.0;

export function gaussRandom() {
  if (return_v) {
    return_v = false;
    return v_val;
  }
  var u = 2 * Math.random() - 1;
  var v = 2 * Math.random() - 1;
  var r = u * u + v * v;
  if (r == 0 || r > 1) return gaussRandom();
  var c = Math.sqrt(-2 * Math.log(r) / r);
  v_val = v * c; // cache this
  return_v = true;
  return u * c;
}

export function randf(a, b) {
  return Math.random() * (b - a) + a;
}

export function randi(a, b) {
  return Math.floor(Math.random() * (b - a) + a);
}

export function randn(mu, std) {
  return mu + gaussRandom() * std;
}

export function zeros(n): any {
  if (typeof (n) === 'undefined' || isNaN(n)) { return []; }
  if (typeof ArrayBuffer === 'undefined') {
    // lacking browser support
    var arr = new Array(n);
    for (var i = 0; i < n; i++) { arr[i] = 0; }
    return arr;
  } else {
    return new Float64Array(n);
  }
}

export function arrContains(arr, elt) {
  for (var i = 0, n = arr.length; i < n; i++) {
    if (arr[i] === elt) return true;
  }
  return false;
}

export function arrUnique(arr) {
  var b = [];
  for (var i = 0, n = arr.length; i < n; i++) {
    if (!arrContains(b, arr[i])) {
      b.push(arr[i]);
    }
  }
  return b;
}

// return max and min of a given non-empty array.
export function maxmin(w): any {
  if (w.length === 0) { return {}; } // ... ;s
  var maxv = w[0];
  var minv = w[0];
  var maxi = 0;
  var mini = 0;
  var n = w.length;
  for (var i = 1; i < n; i++) {
    if (w[i] > maxv) { maxv = w[i]; maxi = i; }
    if (w[i] < minv) { minv = w[i]; mini = i; }
  }
  return { maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv: maxv - minv };
}

export function randperm(n) {
  var i = n,
    j = 0,
    temp;
  var array = [];
  for (var q = 0; q < n; q++)array[q] = q;
  while (i--) {
    j = Math.floor(Math.random() * (i + 1));
    temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function weightedSample(lst, probs) {
  var p = randf(0, 1.0);
  var cumprob = 0.0;
  for (var k = 0, n = lst.length; k < n; k++) {
    cumprob += probs[k];
    if (p < cumprob) { return lst[k]; }
  }
}


// syntactic sugar function for getting default parameter values
export function getopt(opt, field_name, default_value) {
  if (typeof field_name === 'string') {
    // case of single string
    return (typeof opt[field_name] !== 'undefined') ? opt[field_name] : default_value;
  } else {
    // assume we are given a list of string instead
    var ret = default_value;
    for (var i = 0; i < field_name.length; i++) {
      var f = field_name[i];
      if (typeof opt[f] !== 'undefined') {
        ret = opt[f]; // overwrite return value
      }
    }
    return ret;
  }
}

export function assert(condition: any, message: any) {
  if (!condition) {
    message = message || "Assertion failed";
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}











"use strict";
var Vol = webdl.Vol;
var Trainer = (function () {
    function Trainer(net, options) {
        this.net = net;
        var options = options || {};
        this.learning_rate = typeof options.learning_rate !== 'undefined' ? options.learning_rate : 0.01;
        this.l1_decay = typeof options.l1_decay !== 'undefined' ? options.l1_decay : 0.0;
        this.l2_decay = typeof options.l2_decay !== 'undefined' ? options.l2_decay : 0.0;
        this.batch_size = typeof options.batch_size !== 'undefined' ? options.batch_size : 1;
        this.method = typeof options.method !== 'undefined' ? options.method : 'sgd';
        this.momentum = typeof options.momentum !== 'undefined' ? options.momentum : 0.9;
        this.ro = typeof options.ro !== 'undefined' ? options.ro : 0.95;
        this.eps = typeof options.eps !== 'undefined' ? options.eps : 1e-8;
        this.beta1 = typeof options.beta1 !== 'undefined' ? options.beta1 : 0.9;
        this.beta2 = typeof options.beta2 !== 'undefined' ? options.beta2 : 0.999;
        this.k = 0;
        this.gsum = [];
        this.xsum = [];
        if (this.net.layers[this.net.layers.length - 1].layer_type === "regression")
            this.regression = true;
        else
            this.regression = false;
    }
    Trainer.prototype.train = function (x, y) {
        var start = new Date().getTime();
        this.net.forward(x, true);
        var end = new Date().getTime();
        var fwd_time = end - start;
        var start = new Date().getTime();
        var cost_loss = this.net.backward(y);
        var l2_decay_loss = 0.0;
        var l1_decay_loss = 0.0;
        var end = new Date().getTime();
        var bwd_time = end - start;
        if (this.regression && y.constructor !== Array)
            console.log("Warning: a regression net requires an array as training output vector.");
        this.k++;
        if (this.k % this.batch_size === 0) {
            var pglist = this.net.getParamsAndGrads();
            if (this.gsum.length === 0 && (this.method !== 'sgd' || this.momentum > 0.0)) {
                for (var i = 0; i < pglist.length; i++) {
                    this.gsum.push(webdl.util.zeros(pglist[i].params.length));
                    if (this.method === 'adam' || this.method === 'adadelta') {
                        this.xsum.push(webdl.util.zeros(pglist[i].params.length));
                    }
                    else {
                        this.xsum.push([]);
                    }
                }
            }
            for (var i = 0; i < pglist.length; i++) {
                var pg = pglist[i];
                var p = pg.params;
                var g = pg.grads;
                var l2_decay_mul = typeof pg.l2_decay_mul !== 'undefined' ? pg.l2_decay_mul : 1.0;
                var l1_decay_mul = typeof pg.l1_decay_mul !== 'undefined' ? pg.l1_decay_mul : 1.0;
                var l2_decay = this.l2_decay * l2_decay_mul;
                var l1_decay = this.l1_decay * l1_decay_mul;
                var plen = p.length;
                for (var j = 0; j < plen; j++) {
                    l2_decay_loss += l2_decay * p[j] * p[j] / 2;
                    l1_decay_loss += l1_decay * Math.abs(p[j]);
                    var l1grad = l1_decay * (p[j] > 0 ? 1 : -1);
                    var l2grad = l2_decay * (p[j]);
                    var gij = (l2grad + l1grad + g[j]) / this.batch_size;
                    var gsumi = this.gsum[i];
                    var xsumi = this.xsum[i];
                    if (this.method === 'adam') {
                        gsumi[j] = gsumi[j] * this.beta1 + (1 - this.beta1) * gij;
                        xsumi[j] = xsumi[j] * this.beta2 + (1 - this.beta2) * gij * gij;
                        var biasCorr1 = gsumi[j] * (1 - Math.pow(this.beta1, this.k));
                        var biasCorr2 = xsumi[j] * (1 - Math.pow(this.beta2, this.k));
                        var dx = -this.learning_rate * biasCorr1 / (Math.sqrt(biasCorr2) + this.eps);
                        p[j] += dx;
                    }
                    else if (this.method === 'adagrad') {
                        gsumi[j] = gsumi[j] + gij * gij;
                        var dx = -this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij;
                        p[j] += dx;
                    }
                    else if (this.method === 'windowgrad') {
                        gsumi[j] = this.ro * gsumi[j] + (1 - this.ro) * gij * gij;
                        var dx = -this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij;
                        p[j] += dx;
                    }
                    else if (this.method === 'adadelta') {
                        gsumi[j] = this.ro * gsumi[j] + (1 - this.ro) * gij * gij;
                        var dx = -Math.sqrt((xsumi[j] + this.eps) / (gsumi[j] + this.eps)) * gij;
                        xsumi[j] = this.ro * xsumi[j] + (1 - this.ro) * dx * dx;
                        p[j] += dx;
                    }
                    else if (this.method === 'nesterov') {
                        var dx = gsumi[j];
                        gsumi[j] = gsumi[j] * this.momentum + this.learning_rate * gij;
                        dx = this.momentum * dx - (1.0 + this.momentum) * gsumi[j];
                        p[j] += dx;
                    }
                    else {
                        if (this.momentum > 0.0) {
                            var dx = this.momentum * gsumi[j] - this.learning_rate * gij;
                            gsumi[j] = dx;
                            p[j] += dx;
                        }
                        else {
                            p[j] += -this.learning_rate * gij;
                        }
                    }
                    g[j] = 0.0;
                }
            }
        }
        return {
            fwd_time: fwd_time, bwd_time: bwd_time,
            l2_decay_loss: l2_decay_loss, l1_decay_loss: l1_decay_loss,
            cost_loss: cost_loss, softmax_loss: cost_loss,
            loss: cost_loss + l1_decay_loss + l2_decay_loss
        };
    };
    return Trainer;
}());
exports.Trainer = Trainer;

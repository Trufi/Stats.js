(function() {
    function Sampling(options) {
        options = options || {};

        if (typeof performance !== 'undefined' && performance.now) {
            this.time = performance.now.bind(performance);
        } else if (typeof process !== 'undefined') {
            this.time = this._serverTime;
        } else {
            this.time = Date.now.bind(Date);
        }

        this.reset();
        this.update();
    }

    Sampling.ROUND_FACTOR = 1e3;

    Sampling.round = function(value) {
        return Math.round(value * Sampling.ROUND_FACTOR) / Sampling.ROUND_FACTOR;
    };

    Sampling.prototype.add = function(name, x) {
        this._getCounter(name).add(x);
    };

    Sampling.prototype.get = function(name) {
        if (name === undefined) {
            return this._getAll();
        }

        return this._getCounter(name);
    };

    Sampling.prototype.reset = function() {
        this._counters = {};
        this._frameStartTime = this._previousFrameTime = this._createTime = this.time();
        this._frames = 0;
    };

    Sampling.prototype.frameStart = function() {
        this._frameStartTime = this.time();
    };

    Sampling.prototype.frameEnd = function() {
        var now = this.time();

        this.add('ms', now - this._frameStartTime);

        this._frames++;

        if (now > this._previousFrameTime + 1000) {
            var fps = Math.round((this._frames * 1000) / (now - this._previousFrameTime));
            this.add('fps', fps);

            this._frames = 0;
            this._previousFrameTime = now;

            this.update();
        }
    };

    Sampling.prototype.update = function() {
        if (!this._dom) { return; }

        this._element.innerHTML = this.getHtmlText();
    };

    Sampling.prototype.getHtmlElement = function() {
        if (!this._dom) {
            this._dom = true;
            this._element = document.createElement('div');
        }

        return this._element;
    };

    Sampling.prototype.getHtmlText = function() {
        return this.getText().replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;');
    };

    Sampling.prototype.getText = function() {
        var stats = this._getAll();

        var text = 'Elapsed time: ' + Math.round(stats.elapsedTime / 1000) + 's';

        if (stats.counters) {
            text += '\nCounters:';

            for (var name in stats.counters) {
                text += '\n\t' + name + ': ' +
                    '\n\t\tlength: ' + stats.counters[name].length +
                    '\n\t\tlast: ' + stats.counters[name].last +
                    '\n\t\tmean: ' + stats.counters[name].mean +
                    '\n\t\tmin: ' + stats.counters[name].min +
                    '\n\t\tmax: ' + stats.counters[name].max +
                    '\n\t\tdeviation: ' + stats.counters[name].deviation;
            }
        }

        return text;
    };

    Sampling.prototype.getElapsedTime = function() {
        return this.time() - this._createTime;
    };

    Sampling.prototype._getAll = function() {
        var stats = {
            elapsedTime: this.getElapsedTime(),
            counter: {}
        };

        if (Object.keys(this._counters).length) {
            stats.counters = {};

            for (var name in this._counters) {
                stats.counters[name] = this._counters[name].get();
            }
        }

        return stats;
    };

    Sampling.prototype._getCounter = function(name) {
        if (!this._counters[name]) {
            this._createCounter(name);
        }
        return this._counters[name];
    };

    Sampling.prototype._createCounter = function(name) {
        this._counters[name] = new Counter(name);
    };

    Sampling.prototype._serverTime = function() {
        var hrtime = process.hrtime();

        return (hrtime[0] + hrtime[1] / 1e9) * 1000;
    };


    function Counter(name) {
        this.name = name;

        this.sample = [];
        this.limit = Infinity;
        this._sampleIndex = 0;
        this._sampleLength = 0;

        this.max = null;
        this.min = null;
    }

    Counter.prototype.add = function(x) {
        this.sample[this._sampleIndex] = x;
        this._sampleLength++;
        this._sampleIndex = this._sampleLength % this.limit;

        if (this.min === null || this.min > x) {
            this.min = x;
        }

        if (this.max === null || this.max < x) {
            this.max = x;
        }
    };

    Counter.prototype.get = function() {
        var mean = this.getMean();

        return {
            last: this.getLast(),
            mean: mean,
            min: this.getMin(),
            max: this.getMax(),
            deviation: this.getDeviation(mean),
            length: this.getLength()
        };
    };

    Counter.prototype.getLength = function() {
        return this._sampleLength;
    };

    Counter.prototype.getMean = function() {
        var sample = this.sample;
        var mean = sample[0];

        for (var i = 1; i < sample.length; i++) {
            mean += sample[i];
        }

        mean /= sample.length;

        return Sampling.round(mean);
    };

    Counter.prototype.getMin = function() {
        return Sampling.round(this.min);
    };

    Counter.prototype.getMax = function() {
        return Sampling.round(this.max);
    };

    Counter.prototype.getLast = function(index) {
        index = index || 0;
        index = (this._sampleLength - 1 - index) % this.limit;

        return Sampling.round(this.sample[index]);
    };

    Counter.prototype.getDeviation = function(mean) {
        mean = mean !== undefined ? mean : this.getMean();

        var sample = this.sample;
        var dispersion = 0;

        for (var i = 0; i < sample.length; i++) {
            dispersion += Math.pow(sample[i] - mean, 2);
        }

        dispersion = dispersion / sample.length;

        return Sampling.round(Math.sqrt(dispersion));
    };

    Counter.prototype.reset = function() {
        this.sample = [];
        this._sampleIndex = 0;
        this._sampleLength = 0;
        this.min = null;
        this.max = null;
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Sampling;
    }

    if (typeof window !== 'undefined') {
        window.Sampling = Sampling;
    }
})();

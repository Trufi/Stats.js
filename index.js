(function() {
    function Stats(options) {
        options = options || {};

        if (options.dom) {
            this._dom = true;
            this.element = document.createElement('div');
            this.element.style.position = 'absolute';
            this.element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            this.element.style.width = '150px';
        }

        if (performance && performance.now) {
            this._time = performance.now.bind(performance);
        } else if (!window && typeof process !== 'undefined') {
            this._time = this._serverTime;
        } else {
            this._time = Date.now.bind(Date);
        }

        this._roundTo = options.roundTo !== undefined ? options.roundTo : 2;
        this._roundFactor = Math.pow(10, this._roundTo);

        this.reset();
        this.update();
    }

    Stats.prototype.reset = function() {
        this._startTime = this._prevTime = this._createTime = this._time();
        this.elapsedTime = 0;

        this.ms = 0;
        this.meanMs = null;
        this._msTickNumbers = 1;

        this._frames = 0;
        this.fps = 0;
        this.meanFps = null;
        this._fpsTickNumbers = 1;

        this._counters = {};
    };

    Stats.prototype.start = function() {
        this._startTime = this._time();
    };

    Stats.prototype.end = function() {
        var time = this._time();

        this.elapsedTime = time - this._createTime;

        this.ms = time - this._startTime;
        this._msTickNumbers++;

        if (this.meanMs === null) {
            this.meanMs = this.ms;
        } else {
            this.meanMs += (this.ms - this.meanMs) / this._msTickNumbers;
        }

        this._frames++;

        if (time > this._prevTime + 1000) {
            this.fps = Math.round((this._frames * 1000) / (time - this._prevTime));
            this._fpsTickNumbers++;

            if (this.meanFps === null) {
                this.meanFps = this.fps;
            } else {
                this.meanFps += (this.fps - this.meanFps) / this._fpsTickNumbers;
            }

            this._frames = 0;
            this._prevTime = time;

            this.update();
        }
    };

    Stats.prototype.update = function() {
        if (!this._dom) { return; }

        var text = this.getText();

        this.element.innerHTML = text.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;');
    };

    Stats.prototype.getText = function() {
        var stats = this.get();

        var text = 'FPS: ' + stats.fps +
            '\nMean FPS: ' + stats.meanFps +
            '\nMS: ' + stats.ms +
            '\nMean MS: ' + stats.meanMs +
            '\nElapsed time: ' + stats.elapsedTime + 's';

        if (stats.counters) {
            text += '\nCounters:';

            for (var name in stats.counters) {
                text += '\n\t' + name + ': ' +
                    '\n\t\tmean: ' + stats.counters[name].mean +
                    '\n\t\tdeviation: ' + stats.counters[name].deviation;
            }
        }

        return text;
    };

    Stats.prototype.get = function() {
        var result = {
            fps: this.fps,
            meanFps: this._round(this.meanFps),
            ms: this._round(this.ms),
            meanMs: this._round(this.meanMs),
            elapsedTime: Math.round(this.elapsedTime / 1000)
        };

        if (Object.keys(this._counters).length) {
            result.counters = {};

            for (var name in this._counters) {
                result.counters[name] = {
                    mean: this._round(this._counters[name].getMean()),
                    deviation: this._round(this._counters[name].getDeviation())
                };
            }
        }

        return result;
    };

    Stats.prototype._serverTime = function() {
        var hrtime = process.hrtime();

        return (hrtime[0] + hrtime[1] / 1e9) * 1000;
    };

    Stats.prototype._round = function(value) {
        return Math.round(value * this._roundFactor) / this._roundFactor;
    };

    Stats.prototype.addToCounter = function(name, x) {
        if (!this._counters[name]) {
            this._counters[name] = new Counter(name);
        }
        this._counters[name].add(x);
    };

    Stats.prototype.resetCounter = function(name) {
        this._counters[name].reset();
    };

    function Counter(name) {
        this.name = name;
        this.sample = [];
    }

    Counter.prototype.add = function(x) {
        this.sample.push(x);

        if (this.mean === undefined) {
            this.mean = x;
        } else {
            this.mean = this.mean + (x - this.mean) / this.sample.length;
        }
    };

    Counter.prototype.getMean = function() {
        return this.mean;
    };

    Counter.prototype.getDeviation = function() {
        var sample = this.sample;
        var mean = this.mean;
        var dispersion = 0;

        for (var i = 0; i < sample.length; i++) {
            dispersion += Math.pow(sample[i] - mean, 2);
        }

        dispersion = dispersion / sample.length;

        return Math.sqrt(dispersion);
    };

    Counter.prototype.reset = function() {
        this.mean = undefined;
        this.sample = [];
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Stats;
    }

    if (window) {
        window.Stats = Stats;
    }
})();

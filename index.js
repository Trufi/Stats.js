(function() {
    function Stats(options) {
        options = options || {};

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

    Stats.prototype.getHtmlElement = function() {
        if (!this._dom) {
            this._dom = true;
            this._element = document.createElement('div');
            this._element.style.position = 'absolute';
            this._element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            this._element.style.width = '150px';
        }

        return this._element;
    };

    Stats.prototype.reset = function() {
        this._counters = {};
        this._frameStartTime = this._previousFrameTime = this._createTime = this._time();
        this.elapsedTime = 0;
        this._frames = 0;
    };

    Stats.prototype.frameStart = function() {
        this._frameStartTime = this._time();
    };

    Stats.prototype.frameEnd = function() {
        var now = this._time();

        this.elapsedTime = now - this._createTime;

        this.addToCounter('ms', now - this._frameStartTime);

        this._frames++;

        if (now > this._previousFrameTime + 1000) {
            var fps = Math.round((this._frames * 1000) / (now - this._previousFrameTime));
            this.addToCounter('fps', fps);

            this._frames = 0;
            this._previousFrameTime = now;

            this.update();
        }
    };

    Stats.prototype.update = function() {
        if (!this._dom) { return; }

        var text = this.getText();

        this._element.innerHTML = text.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;');
    };

    Stats.prototype.getText = function() {
        var stats = this.get();

        var text = 'Elapsed time: ' + stats.elapsedTime + 's';

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
        console.time('test');
        var result = {
            elapsedTime: Math.round(this.elapsedTime / 1000),
            counter: {}
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
        console.timeEnd('test');

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

    Counter.prototype.last = function() {
        return this.sample[this.sample.length - 1];
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

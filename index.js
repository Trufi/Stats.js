(function() {
    function Stats(options) {
        options = options || {};

        if (performance && performance.now) {
            this.time = performance.now.bind(performance);
        } else if (!window && typeof process !== 'undefined') {
            this.time = this._serverTime;
        } else {
            this.time = Date.now.bind(Date);
        }

        this.reset();
        this.update();
    }

    Stats.ROUND_FACTOR = 1e3;

    Stats.round = function(value) {
        return Math.round(value * Stats.ROUND_FACTOR) / Stats.ROUND_FACTOR;
    };

    Stats.prototype.add = function(name, x) {
        this._getCounter(name).add(x);
    };

    Stats.prototype.get = function(name) {
        if (name === undefined) {
            return this._getAll();
        }

        return this._getCounter(name);
    };

    Stats.prototype.reset = function() {
        this._counters = {};
        this._frameStartTime = this._previousFrameTime = this._createTime = this.time();
        this._frames = 0;
    };

    Stats.prototype.frameStart = function() {
        this._frameStartTime = this.time();
    };

    Stats.prototype.frameEnd = function() {
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

    Stats.prototype.update = function() {
        if (!this._dom) { return; }

        var text = this.getText();

        this._element.innerHTML = text.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;');
    };

    Stats.prototype.getHtmlElement = function() {
        if (!this._dom) {
            this._dom = true;
            this._element = document.createElement('div');
            this._element.style.position = 'absolute';
            this._element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            this._element.style.minWidth = '150px';
        }

        return this._element;
    };

    Stats.prototype.getText = function() {
        var stats = this._getAll();

        var text = 'Elapsed time: ' + Math.round(stats.elapsedTime / 1000) + 's';

        if (stats.counters) {
            text += '\nCounters:';

            for (var name in stats.counters) {
                text += '\n\t' + name + ': ' +
                    '\n\t\tlength: ' + stats.counters[name].length +
                    '\n\t\tlast: ' + stats.counters[name].last +
                    '\n\t\tmean: ' + stats.counters[name].mean +
                    '\n\t\tdeviation: ' + stats.counters[name].deviation;
            }
        }

        return text;
    };

    Stats.prototype.getElapsedTime = function() {
        return this.time() - this._createTime;
    };

    Stats.prototype._getAll = function() {
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

    Stats.prototype._getCounter = function(name) {
        if (!this._counters[name]) {
            this._createCounter(name);
        }
        return this._counters[name];
    };

    Stats.prototype._createCounter = function(name) {
        this._counters[name] = new Counter(name);
    };

    Stats.prototype._serverTime = function() {
        var hrtime = process.hrtime();

        return (hrtime[0] + hrtime[1] / 1e9) * 1000;
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

    Counter.prototype.get = function() {
        return {
            last: this.getLast(),
            mean: this.getMean(),
            deviation: this.getDeviation(),
            length: this.getLength()
        };
    };

    Counter.prototype.getLength = function() {
        return this.sample.length;
    };

    Counter.prototype.getMean = function() {
        return Stats.round(this.mean);
    };

    Counter.prototype.getLast = function(index) {
        index = index || 0;

        return Stats.round(this.sample[this.sample.length - 1 - index]);
    };

    Counter.prototype.getDeviation = function() {
        var sample = this.sample;
        var mean = this.mean;
        var dispersion = 0;

        for (var i = 0; i < sample.length; i++) {
            dispersion += Math.pow(sample[i] - mean, 2);
        }

        dispersion = dispersion / sample.length;

        return Stats.round(Math.sqrt(dispersion));
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

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

    this.roundFactor = Math.pow(10, 2);

    this.reset();
    this.update();
}

Stats.prototype.reset = function() {
    this._startTime = this._prevTime = this._createTime = this._time();
    this.elapsedTime = 0;

    this.ms = 0;
    this.averageMs = null;
    this._msTickNumbers = 1;

    this._frames = 0;
    this.fps = 0;
    this.averageFps = null;
    this._fpsTickNumbers = 1;
};

Stats.prototype.start = function() {
    this._startTime = this._time();
};

Stats.prototype.end = function() {
    var time = this._time();

    this.elapsedTime = time - this._createTime;

    this.ms = time - this._startTime;
    this._msTickNumbers++;

    if (this.averageMs === null) {
        this.averageMs = this.ms;
    } else {
        this.averageMs += (this.ms - this.averageMs) / this._msTickNumbers;
    }

    this._frames++;

    if (time > this._prevTime + 1000) {
        this.fps = Math.round((this._frames * 1000) / (time - this._prevTime));
        this._fpsTickNumbers++;

        if (this.averageFps === null) {
            this.averageFps = this.fps;
        } else {
            this.averageFps += (this.fps - this.averageFps) / this._fpsTickNumbers;
        }

        this._frames = 0;
        this._prevTime = time;

        this.update();
    }
};

Stats.prototype.update = function() {
    if (!this._dom) { return; }

    this.element.innerHTML = 'FPS: ' + this.fps +
        '<br>Average FPS: ' + this._round(this.averageFps) +
        '<br>MS: ' + this._round(this.ms) +
        '<br>Average MS: ' + this._round(this.averageMs) +
        '<br>Elapsed time: ' + Math.round(this.elapsedTime / 1000) + 's';
};

Stats.prototype.getText = function() {
    return 'FPS: ' + this.fps +
        '\nAverage FPS: ' + this._round(this.averageFps) +
        '\nMS: ' + this._round(this.ms) +
        '\nAverage MS: ' + this._round(this.averageMs) +
        '\nElapsed time: ' + Math.round(this.elapsedTime / 1000) + 's';
};

Stats.prototype._serverTime = function() {
    var hrtime = process.hrtime();

    return (hrtime[0] + hrtime[1] / 1e9) * 1000;
};

Stats.prototype._round = function(value) {
    return Math.round(value * this.roundFactor) / this.roundFactor;
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Stats;
}

if (window) {
    window.Stats = Stats;
}

(function() {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    function Plot(canvas, options) {
        options = options || {};

        this.color = options.color || '#000000';
        this.meanColor = options.mean;

        this.highlightColor = options.highlightColor || '#ff0000';
        this.highlightLineColor = options.highlightLineColor;
        this.highlightThreshold = options.highlightThreshold;
        this.highlightSize = options.highlightSize || 10;

        this.limit = options.limit || 200;
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');
        this._size = [canvas.clientWidth, canvas.clientHeight];
    }

    Plot.prototype.draw = function(counter) {
        var ctx = this._ctx;
        ctx.clearRect(0, 0, this._size[0], this._size[1]);

        var limit = this.limit;
        var sample = counter.sample;

        var step = this._size[0] / limit;
        var i, y;

        var start = Math.max(sample.length - limit, 0);
        var end = Math.min(sample.length, start + limit);
        var x = 0;

        var startValue = sample[start];
        var max = startValue;
        var min = startValue;
        var mean = startValue;
        for (i = start + 1; i < end; i++) {
            var value = sample[i];
            max = Math.max(max, value);
            min = Math.min(min, value);
            mean += value;
        }
        mean /= end - start;

        if (this.highlightThreshold && this.highlightLineColor) {
            ctx.beginPath();
            y = (1 - (this.highlightThreshold - min) / (max - min)) * this._size[1]
            ctx.moveTo(0, y);
            ctx.lineTo(this._size[0], y);
            ctx.strokeStyle = this.highlightLineColor;
            ctx.stroke();
        }

        if (this.meanColor) {
            ctx.beginPath();
            y = (1 - (mean - min) / (max - min)) * this._size[1]
            ctx.moveTo(0, y);
            ctx.lineTo(this._size[0], y);
            ctx.strokeStyle = '#0000ff';
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = this.highlightColor;

        for (i = start; i < end; i++) {
            y = (1 - (sample[i] - min) / (max - min)) * this._size[1];

            if (i === start) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            if (this.highlightThreshold && sample[i] > this.highlightThreshold) {
                ctx.fillRect(
                    x - this.highlightSize / 2, y - this.highlightSize / 2,
                    this.highlightSize, this.highlightSize
                );
            }

            x += step;
        }

        ctx.strokeStyle = this.color;
        ctx.stroke();
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Plot;
    }

    if (typeof window !== 'undefined') {
        window.Plot = Plot;
    }
})();

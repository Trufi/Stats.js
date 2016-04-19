var test = require('ava');

var Stats = require('./index.js');

test('Several #add calls', t => {
    var stats = new Stats();

    stats.add('a', 1);

    var counterA = stats.get('a');

    t.is(counterA.getLast(), 1);
    t.is(counterA.getMean(), 1);
    t.is(counterA.getMin(), 1);
    t.is(counterA.getMax(), 1);
    t.is(counterA.getDeviation(), 0);
    t.is(counterA.getLength(), 1);

    stats.add('a', 3);

    t.is(counterA.getLast(), 3);
    t.is(counterA.getMean(), 2);
    t.is(counterA.getMin(), 1);
    t.is(counterA.getMax(), 3);
    t.is(counterA.getDeviation(), 1);
    t.is(counterA.getLength(), 2);

    stats.add('a', 5);

    t.is(counterA.getLast(), 5);
    t.is(counterA.getMean(), 3);
    t.is(counterA.getMin(), 1);
    t.is(counterA.getMax(), 5);
    t.is(counterA.getDeviation(), 1.633);
    t.is(counterA.getLength(), 3);
});

test('Limit counter sample length', t => {
    var stats = new Stats();

    var counterA = stats.get('a');

    counterA.sampleLimit = 4;

    stats.add('a', 1);
    stats.add('a', 1);
    stats.add('a', 1);
    stats.add('a', 1);

    t.is(counterA.getLast(), 1);
    t.is(counterA.getMean(), 1);
    t.is(counterA.getMin(), 1);
    t.is(counterA.getMax(), 1);
    t.is(counterA.getDeviation(), 0);
    t.is(counterA.getLength(), 4);

    stats.add('a', 5);

    t.is(counterA.getLast(), 5);
    t.is(counterA.getMean(), 2);
    t.is(counterA.getMin(), 1);
    t.is(counterA.getMax(), 5);
    t.is(counterA.getDeviation(), 1.732);
    t.is(counterA.getLength(), 5);
});

test('Math.random', t => {
    var stats = new Stats();

    for (var i = 0; i < 1000; i++) {
        stats.add('a', Math.random());
    }

    var mean = stats.get('a').getMean();

    t.true(Math.abs(mean - 0.5) < 0.1);
});

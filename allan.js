/*!
 * Allan.js v0.1
 *
 * 2012, Pablo Garaizar <http://garaizar.com/>
 *
 * Based on: 
 *   adev3, by Tom Van Baak <http://www.leapsecond.com/>
 *   allan, by Magnus Danielson <http://rubidium.dyndns.org/>
 *   Stable32, by William J. Riley <http://www.stable32.com/>
 *   Flot, by Ole Laursen <http://code.google.com/p/flot/>
 *
 * Available under MIT license.
 */

;(function (root, undefined) {
//  'use strict';

  /** Allan module definition */
  var Allan = {};

  /** Assign each dataset an incremental id */
  var datasetId = 0;

  /** @const {Number} Minimum number of samples for an Allan deviation */
  var MIN_SAMPLES = 3;

  /**
   * The Allan Dataset constructor.
   *
   * @constructor
   * @param {String} name A name to identify the dataset.
   */
  Allan.Dataset = function (name) {
    this.id = ++datasetId;
    this.name = name || new Date().toString(); // Asign current date as a fallback name
    this.x = [];
    this.y = [];
    this.values = {
      xavg: [],
      xmax: [],
      xmin: [],
      yavg: [],
      ymax: [],
      ymin: [],
      stdev: [],
      adev: [],
      oadev: [],
      mdev: [],
      tdev: [],
      hdev: [],
      ohdev: [],
      totdev: [],
      mtotdev: [],
      ttotdev: [],
      htotdev: []
    };
    return this;
  };

  Allan.Dataset.prototype = {
    id: 0,         // {Number} id of the dataset
    name: '',      // {String} custom description of the dataset
    x: [],         // {Array}  array of sequential time-error values
    y: [],         // {Array}  array of fractional frequency values
    values: {      // {Object} calculated values of the dataset
      xavg: [],    // {Array}  array of mean values of the phase data
      xmax: [],    // {Array}  array of maximum values of the phase data
      xmin: [],    // {Array}  array of minimum values of the phase data
      yavg: [],    // {Array}  array of mean values of the frequency data
      ymax: [],    // {Array}  array of maximum values of the frequency data
      ymin: [],    // {Array}  array of minimum values of the frequency data
      stdev: [],   // {Array}  array of standard deviation values
      adev: [],    // {Array}  array of Allan deviation estimators (non-overlapping)
      oadev: [],   // {Array}  array of Allan deviation estimators (overlapping)
      mdev: [],    // {Array}  array of Modified Allan deviation estimators
      tdev: [],    // {Array}  array of Time deviation estimators
      hdev: [],    // {Array}  array of Hadamard deviation estimators (non-overlapping)
      ohdev: [],   // {Array}  array of Hadamard deviation estimators (non-overlapping)
      totdev: [],  // {Array}  array of Total deviation estimators
      mtotdev: [], // {Array}  array of Modified Total deviation estimators
      ttotdev: [], // {Array}  array of Time Total deviation estimators
      htotdev: []  // {Array}  array of Hadamard Total deviation estimators
    },	

    /**
     * Converts an array of sequential time-error values into a fractional frequency values array.
     *
     * @param {Array} x Array of sequential time-error values.
     * @param {Array} m Averaging time.
     * @returns {Array} Array of fractional frequency values.
     */
    phaseToFreq: function (x, m) {
      var y = [];

      m = m || 1;

      for (var i = 0, len = x.length; i + 1 < len; i++) {
        y[i] = (x[i + 1] - x[i]) / m;
      }

      return y;
    },

    /**
     * Converts an array of fractional frequency values into a sequential time-error values array.
     *
     * @param {Array} y Array of fractional frequency values.
     * @param {Array} m Averaging time.
     * @returns {Array} Array of sequential time-error values.
     */
    freqToPhase: function (y, m) {
      var x = [0];

      m = m || 1;

      for (var i = 1, len = y.length; i <= len; i++) {
        x[i] = x[i - 1] + y[i - 1] * m;
      }

      return x;
    },

    /**
     * Initializes the array of sequential time-error values (x) from an array.
     *
     * @param {Array} phase Array of sequential time-error values.
     * @returns nothing.
     */
    loadPhaseFromArray: function (phase) {
      this.x = phase;
      this.y = this.phaseToFreq(phase);
    },
    
    /**
     * Initializes the array of sequential time-error values (x) from a URL.
     *
     * @param {String} url URL containing the multi-line data file.
     * @returns nothing.
     */
    loadPhaseFromURL: function (url) {
      var request = new XMLHttpRequest(),
          me = this;

      request.open('GET', url, false);
      request.onreadystatechange = (function () {
        return function () {
          var a, n, x;
          if (request.readyState == 4) {
            x = [];
            a = request.response.split('\r\n');
            for (var i = 0, len = a.length; i < len; i++) {
              n = parseFloat(a[i]);
              if (!isNaN(n)) {
                x.push(n);
              }
            }
            me.loadPhaseFromArray(x);
          }
        };
      })(me);
      request.send();
    },
    
    /**
     * Initializes the array of fractional frequency values (y) from an array.
     *
     * @param {Array} freq Array of fractional frequency values.
     * @returns nothing.
     */
    loadFreqFromArray: function (freq) {
      this.y = freq;
      this.x = this.freqToPhase(freq);
    },
    
    /**
     * Initializes the array of sequential time-error values (x) from a URL.
     *
     * @param {String} url URL containing the multi-line data file.
     * @returns nothing.
     */
    loadFreqFromURL: function (url) {
      var request = new XMLHttpRequest(),
          me = this;

      request.open('GET', url, false);
      request.onreadystatechange = (function () {
        return function () {
          var a, n, y;
          if (request.readyState == 4) {
            y = [];
            a = request.response.split('\r\n');
            for (var i = 0, len = a.length; i < len; i++) {
              n = parseFloat(a[i]);
              if (!isNaN(n)) {
                y.push(n);
              }
            }
            me.loadFreqFromArray(y);
          }
        };
      })(me);
      request.send();
    },

    /**
     * Average value of a subset of an array.
     *
     * @private
     * @param {Number} i index of the subset.
     * @param {Number} m Averaging time.
     * @param {Array} a Array.
     * @returns {Number} Average value of the subset of the array.
     */
    _arrayAvg: function (i, m, a) {
      var avg = 0;

      i = i || 0;
      m = m || 0;
      
      for (var j = 0; j < m; j++) {
        avg += a[i + j];
      }
      avg /= m;

      return avg;
    },

    /**
     * Average value of a subset of x.
     *
     * @private
     * @param {Number} i index of the subset.
     * @param {Number} m Averaging time.
     * @returns {Number} Average value of the subset of x.
     */
    _phaseAvg: function (i, m) {
      return this._arrayAvg(i, m, this.x);
    },

    /**
     * Average value of a subset of y.
     *
     * @private
     * @param {Number} i index of the subset.
     * @param {Number} m Averaging time.
     * @returns {Number} Average value of the subset of y.
     */
    _freqAvg: function (i, m) {
      return this._arrayAvg(i, m, this.y);
    },

    /**
     * Average of x.
     *
     * @param {Number} m Averaging time.
     * @returns {Number} AVG.
     */
    getPhaseAvg: function (m) {
      var sum = 0,
          len = this.x.length;

      m = m || 1;

      if(this.values.xavg[m] === undefined) {
        for (var i = 0; i < len; i+=m) {
          sum += this._phaseAvg(i, m);
        }
        this.values.xavg[m] = sum * m  / len;
      }
      return this.values.xavg[m];
    },

    /**
     * Average of y.
     *
     * @param {Number} m Averaging time.
     * @returns {Number} AVG.
     */
    getFreqAvg: function (m) {
      var sum = 0,
          len = this.y.length;

      m = m || 1;

      if(this.values.yavg[m] === undefined) {
        for (var i = 0; i < len; i+=m) {
          sum += this._freqAvg(i, m);
        }
        this.values.yavg[m] = sum * m  / len;
      }
      return this.values.yavg[m];
    },

    /**
     * Maximum value of x.
     *
     * @param {Number} m Averaging time.
     * @returns {Number} Maximum value of x.
     */
    getPhaseMax: function (m) {
      m = m || 1;
      if(this.values.xmax[m] === undefined) {
        this.values.xmax[m] = -Infinity;
        for (var i = 0, len = this.x.length, a; i < len; i += m) {
          a = this._phaseAvg(i, m);
          if (a > this.values.xmax[m]) {
            this.values.xmax[m] = a;
          }
        }
      }
      return this.values.xmax[m];
    },

    /**
     * Maximum value of y.
     *
     * @param {Number} m Averaging time.
     * @returns {Number} Maximum value of y.
     */
    getFreqMax: function (m) {
      m = m || 1;
      if(this.values.ymax[m] === undefined) {
        this.values.ymax[m] = -Infinity;
        for (var i = 0, len = this.y.length, a; i < len; i += m) {
          a = this._freqAvg(i, m);
          if (a > this.values.ymax[m]) {
            this.values.ymax[m] = a;
          }
        }
      }
      return this.values.ymax[m];
    },

    /**
     * Minimum value of x.
     *
     * @param {Number} m Averaging time.
     * @returns {Number} Maximum value of x.
     */
    getPhaseMin: function (m) {
      m = m || 1;
      if(this.values.xmin[m] === undefined) {
        this.values.xmin[m] = Infinity;
        for (var i = 0, len = this.x.length, a; i < len; i += m) {
          a = this._phaseAvg(i, m);
          if (a < this.values.xmin[m]) {
            this.values.xmin[m] = a;
          }
        }
      }
      return this.values.xmin[m];
    },

    /**
     * Minimum value of y.
     *
     * @param {Number} m Averaging time.
     * @returns {Number} Maximum value of y.
     */
    getFreqMin: function (m) {
      m = m || 1;
      if(this.values.ymin[m] === undefined) {
        this.values.ymin[m] = Infinity;
        for (var i = 0, len = this.y.length, a; i < len; i += m) {
          a = this._freqAvg(i, m);
          if (a < this.values.ymin[m]) {
            this.values.ymin[m] = a;
          }
        }
      }
      return this.values.ymin[m];
    },

    /**
     * Generate an object with values and options to be plotted by Flot.
     *
     * @param {Number} m Averaging time.
     * @returns {Object} Object with values and options for Flot.
     */
    getPhasePlot: function (m) {
      var d = [];

      m = m || 1;

      for (var i = 0, len = this.x.length; i < len; i += m) {
        d.push([i, this._phaseAvg(i, m)]);
      }

      return {
        values: [
          { 
            label: 'x(' + m + ')',
            data: d
          }
        ],
        options: {
          series: {
            lines: { show: true },
            points: { show: true }
          }
        }
      };
    },

    /**
     * Generate an object with values and options to be plotted by Flot.
     *
     * @param {Number} m Averaging time.
     * @returns {Object} Object with values and options for Flot.
     */
    getFreqPlot: function (m) {
      var d = [];

      m = m || 1;

      for (var i = 0, len = this.y.length; i < len; i += m) {
        d.push([i, this._freqAvg(i, m)]);
      }

      return {
        values: [
          { 
            label: 'y(' + m + ')',
            data: d
          }
        ],
        options: {
          series: {
            lines: { show: true },
            points: { show: true }
          }
        }
      };
    },

    /**
     * Generate an object with values and options to be plotted by Flot.
     *
     * @param {Array} d Array of strings with deviations to be plotted (e.g. ['ADEV', 'HDEV', 'MDEV']).
     * @returns {Object} Object with values and options for Flot.
     */
    getSigmaTauPlot: function (d) {
      var series = [],
          v,
          dname,
          adev,
          e, 
          vmin = Infinity,
          vmax = -Infinity,
          expmin = Infinity,
          expmax = -Infinity;

      for(var dev in d) {
        dname = d[dev].toLowerCase();
        v = [];
        adev = this.values[dname];
	for(var val in adev) {
          if (adev[val] !== undefined && adev[val] !== 0) {
            v.push([val, adev[val]]);
            if (val < vmin) {
              vmin = val;
            }
            if (val > vmax) {
              vmax = val;
            }            
            e = Math.floor(Math.log(adev[val]) / Math.LN10);
            if (e < expmin) {
              expmin = e;
            }
            if (e > expmax) {
              expmax = e;
            }
          }
        }
        series.push({ label: d[dev], data: v });
      }

      return {
        values: series,
        options: {
          series: {
            lines: { show: true },
            points: { show: true }
          },
          xaxis: {
            min: Math.pow(10, Math.floor(Math.log(vmin) / Math.LN10)),
            max: Math.pow(10, Math.floor(Math.log(vmax) / Math.LN10) + 2),
            ticks: function (axis) {
              var min,
                  max,
                  ticks = [];
              min = (axis.min !== 0) ? Math.floor(Math.log(axis.min) / Math.LN10) - 1 : 0;
              min = Math.pow(10, min);
              max = (axis.max !== 0) ? Math.floor(Math.log(axis.max) / Math.LN10) : 0;
              max = Math.pow(10, max);
              for (var o = min; o < max; o *= 10) {
                ticks.push([o, '10' + (Math.round(Math.log(o)/Math.LN10)).toString().sup()]);
                for (var i = 2; i < 10; i++) {
                  ticks.push([o * i, '']);
                }
              }
              ticks.push([Math.pow(10, Math.floor(Math.log(vmax) / Math.LN10) + 2), '\u03c4']);
              return ticks;
            },
            transform: function (v) { return Math.log(v) / Math.LN10; },
            inverseTransform: function (v) { return Math.Pow(10, v); }
          },
          yaxis: {
            min: Math.pow(10, expmin),
            max: Math.pow(10, expmax + 2),
            ticks: function () {
              var min = Math.pow(10, expmin),
                  max = Math.pow(10, (expmax + 2)),
                  ticks = [];
              for (var o = min; o < max; o *= 10) {
                ticks.push([o, '10' + (Math.round(Math.log(o)/Math.LN10)).toString().sup()]);
                for (var i = 2; i < 10; i++) {
                  ticks.push([o * i, '']);
                }
              }
              ticks.push([max, '\u03c3(\u03c4)']);
              return ticks;
            }, 
            transform: function (v) { 
              if (v === 0) {
                v = parseFloat('1e' + expmin);
              }
              return Math.log(v) / Math.LN10; 
            },
            inverseTransform: function (v) { return Math.Pow(10, v); }
          }
        }
      };
    },

    /**
     * Standard Deviation of the dataset.
     *
     * @param {Number} m Averaging time.
     * @returns {Number} STDEV.
     */
    getStdev: function (m) {
      var sum = 0,
          len = this.y.length,
          a;

      m = m || 1;

      if(this.values.stdev[m] === undefined) {
        a = this.getFreqAvg(m);
        for (var i = 0, v; i < len; i+=m) {
          v = this._freqAvg(i, m) - a;
          sum += v * v;
        }
        this.values.stdev[m] = Math.sqrt(sum / (len / m - 1));
      }
      return this.values.stdev[m];
    },

    /**
     * Allan Deviation of the dataset.
     *
     * Square root of AVAR:
     *
     *              1    N-2
     * s²y(t) = -------- Σ   [ x(i+2) - 2x(i+1) + x(i) ]²
     *          2t²(N-2) i=1
     *
     * @param {Number} m Averaging time.
     * @returns {Number} ADEV.
     */
    getAdev: function (m) {
      var n = 0,
          sum = 0;

      m = m || 1;

      if(this.values.adev[m] === undefined) {
        for (var i = 0, len = this.x.length, v; i < len - 2 * m; i++) {
          v = this.x[i + 2 * m] - 2 * this.x[i + m] + this.x[i];
          sum += v * v;
          n++;
        }
        this.values.adev[m] = (n > MIN_SAMPLES) ? Math.sqrt(sum / (2 * n)) / m : 0;
      }
      return this.values.adev[m];
    },

    /**
     * Overlapping Allan Deviation of the dataset.
     *
     * Square root of overlapping AVAR:
     *
     *              1     N-2m
     * s²y(t) = --------- Σ   [ x(i+2m) - 2x(i+m) + x(i) ]²
     *          2t²(N-2m) i=1
     *
     * @param {Number} m Averaging time.
     * @returns {Number} OADEV.
     */
    getOadev: function (m) {
      var n = 0,
          sum = 0;

      m = m || 1;

      if(this.values.oadev[m] === undefined) {
        for (var i = 0, len = this.x.length, v; i < len - 2 * m; i+=m) {
          v = this.x[i + 2 * m] - 2 * this.x[i + m] + this.x[i];
          sum += v * v;
          n++;
        }
        this.values.oadev[m] = (n > MIN_SAMPLES) ? Math.sqrt(sum / (2 * n)) / m : 0;
      }
      return this.values.oadev[m];
    },

    /**
     * Modified Allan Deviation of the dataset.
     *
     * Square root of MVAR:
     *
     *                    1       N-3m+1   j+m-1
     * Mod s²y(t) = ------------- Σ      { Σ   [x(i+2m) - 2x(i+m) + x(i) ] }²
     *              2m²t²(N-3m+1) j=1      i=j
     *
     * @param {Number} m Averaging time.
     * @returns {Number} MDEV.
     * 
     * Based on Tom Van Baak's unnested loops version
     */
    getMdev: function (m) {
      var n = 0,
          sum = 0,
          v = 0;

      m = m || 1;

      if(this.values.mdev[m] === undefined) {
        for (var i = 0, len = this.x.length; i < len - 2 * m && i < m; i++) {
          v += this.x[i + 2 * m] - 2 * this.x[i + m] + this.x[i];
        }
        sum += v * v;
        n++;
        for (var i = 0, len = this.x.length; i < len - 3 * m; i++) {
          v += this.x[i + 3 * m] - 3 * this.x[i + 2 * m] + 3 * this.x[i + m] - this.x[i];
          sum += v * v;
          n++;
        }
        this.values.mdev[m] = (n > MIN_SAMPLES) ? Math.sqrt(sum / (2 * m * m * n)) / m : 0;
      }
      return this.values.mdev[m];
    },

    /**
     * Time Deviation of the dataset.
     *
     * Square root of TVAR:
     *
     * s²x(t) = (t²/3) · Mod s²y(t)
     *
     * @param {Number} m Averaging time.
     * @returns {Number} TDEV.
     */
    getTdev: function (m) {
      var dev = 0;

      m = m || 1;

      if(this.values.tdev[m] === undefined) {
        dev = this.getMdev(m);
        this.values.tdev[m] = dev * m / Math.sqrt(3);
      }
      return this.values.tdev[m];
    },

    /**
     * Hadamard Deviation of the dataset.
     *
     * Square root of HVAR:
     *
     *              1     N-3
     * Hs²y(t) = -------- Σ   [ x(i+3) - 3x(i+2) + 3x(i+1) - x(i) ]²
     *           6t²(N-3) i=1
     *
     * @param {Number} m Averaging time.
     * @returns {Number} HDEV.
     */
    getHdev: function (m) {
      var n = 0,
          sum = 0;

      m = m || 1;

      if(this.values.hdev[m] === undefined) {
        for (var i = 0, len = this.x.length, v; i < len - 3 * m; i++) {
          v = this.x[i + 3 * m] - 3 * this.x[i + 2 * m] + 3 * this.x[i + m] - this.x[i];
          sum += v * v;
          n++;
        }
        this.values.hdev[m] = (n > MIN_SAMPLES) ? Math.sqrt(sum / (6 * n)) / m : 0;
      }
      return this.values.hdev[m];
    },

    /**
     * Overlapping Hadamard Deviation of the dataset.
     *
     * Square root of overlapping HVAR:
     *
     *              1      N-3m
     * Hs²y(t) = --------- Σ   [ x(i+3m) - 3x(i+2m) + 3x(i+m) - x(i) ]²
     *           6t²(N-3m) i=1
     *
     * @param {Number} m Averaging time.
     * @returns {Number} HDEV.
     */
    getOhdev: function (m) {
      var n = 0,
          sum = 0;

      m = m || 1;

      if(this.values.ohdev[m] === undefined) {
        for (var i = 0, len = this.x.length, v; i < len - 3 * m; i+=m) {
          v = this.x[i + 3 * m] - 3 * this.x[i + 2 * m] + 3 * this.x[i + m] - this.x[i];
          sum += v * v;
          n++;
        }
        this.values.ohdev[m] = (n > MIN_SAMPLES) ? Math.sqrt(sum / (6 * n)) / m : 0;
      }
      return this.values.ohdev[m];
    },

    /**
     * Total Deviation of the dataset.
     *
     * Square root of TOTVAR:
     *
     *                  1    N-1
     * s²total(t) = -------- Σ   [ x*(i-m) - 2x*(i) + x*(i+m) ]²
     *              2t²(N-2) i=2
     *
     * @param {Number} m Averaging time.
     * @returns {Number} TOTDEV.
     */
    getTotdev: function (m) {
      var n = 0,
          e = 0,
          sum = 0,
          len = this.x.length,
          nx = this.x.slice(0);

      m = m || 1;

      if(this.values.totdev[m] === undefined) {
        for (var i = 1; i < len - 1; i++) {
          nx.unshift(2 * this.x[0] - this.x[i]);
          nx.push(2 * this.x[len - 1] - this.x[len - 1 - i]);
          e++;
        }
        if (e + len + m - 1 <= 3 * len - 4) {
          for (var i = 1, v; i < len - 1; i++) {
            v = nx[e + i - m] - 2 * nx[e + i] + nx[e + i + m];
            sum += v * v;
            n++;
          }
          sum /= 2;
        }
        this.values.totdev[m] = (n > MIN_SAMPLES) ? Math.sqrt(sum / n) / m : 0;
      }
      return this.values.totdev[m];
    },

    /**
     * Modified Total Deviation of the dataset.
     *
     * Square root of MTOTVAR:
     *
     *                         1       N-3m+1    1   n+3m-1
     * Mod s²total(t) = -------------- Σ      { ---  Σ      [0zi*(m)]² }
     *                  2m²t0²(N-3m+1) n=1       6m  i=n-3m
     *
     * @param {Number} m Averaging time.
     * @returns {Number} MTOTDEV.
     */
    getMtotdev: function (m) {
      var n,
          sum = 0,
          len = this.x.length,
          half = Math.floor((3 * m + 1) / 2),
          f,
          nx,
          zx,
          d = 0,
          bias = 0.73; // Bias factor for white FM noise

      m = m || 1;

      if(this.values.mtotdev[m] === undefined) {
        for (n = 0; n < len - 3 * m + 1; n++) {
          // Generate 0zi*(m)
          f = 0;
          for (var i = 0, h = Math.floor(3 * m / 2); i < h; i++) {
            f += (this.x[n + i + half] - this.x[n + i]) / half;
          }
          f /= i;
          zx = [];
          for (var i = 0; i <= 3 * m - 1; i++) {
            zx[i] = this.x[n + i] - f * i;
          }
          nx = [];
          for (var i = 0; i <= 3 * m - 1; i++) {
            nx[n + i] = zx[3 * m - i - 1];
            nx[n + 3 * m + i] = zx[i];
            nx[n + 6 * m + i] = zx[3 * m - i - 1];
          }
          // Calculate MTOTDEV
          sum = 0;
          for (var i = n - 3 * m, av1, av2, av3; i <= n + 3 * m - 1; i++) {
            av1 = 0;
            av2 = 0;
            av3 = 0;
            for (var j = 0; j < m; j++) {
              av1 += nx[i + 3 * m + j];
              av2 += nx[i + 3 * m + m + j];
              av3 += nx[i + 3 * m + 2 * m + j];
            }
            av1 /= m;
            av2 /= m;
            av3 /= m;
            v = av1 - 2 * av2 + av3;
            sum += v * v;
          }
          d += sum / 6 * m;
        }
        d /= 2 * (len - 3 * m + 1);
        this.values.mtotdev[m] = (n > MIN_SAMPLES) ? Math.sqrt(d / bias) / (m * m): 0;
      }
      return this.values.mtotdev[m];
    },

    /**
     * Time Total Deviation of the dataset.
     *
     * Square root of TTOTVAR:
     *
     * Total s²x(t) = (t²/3) · Mod s²total(t) 
     *
     * @param {Number} m Averaging time.
     * @returns {Number} TTOTDEV.
     */
    getTtotdev: function (m) {
      var dev = 0;

      m = m || 1;

      if(this.values.ttotdev[m] === undefined) {
        dev = this.getMtotdev(m);
        this.values.ttotdev[m] = dev * m / Math.sqrt(3);
      }
      return this.values.ttotdev[m];
    },

    /**
     * Hadamard Total Deviation of the dataset.
     *
     * Square root of HTOTVAR:
     *
     *                     1     N-3m+1    1   n+3m-1
     * Total Hs²y(t) = --------- Σ      { ---  Σ      [Hi(m)]² }
     *                 6(N-3m+1) n=1       6m  i=n-3m
     *
     * @param {Number} m Averaging time.
     * @returns {Number} HTOTDEV.
     */
    getHtotdev: function (m) {
      var n,
          sum = 0,
          len = this.y.length,
          half = Math.floor((3 * m + 1) / 2),
          f,
          ny,
          zy,
          d = 0;

      m = m || 1;

      if(this.values.htotdev[m] === undefined) {
        for (n = 0; n < len - 3 * m + 1; n++) {
          // Generate Hi*(m)
          f = 0;
          for (var i = 0, h = Math.floor(3 * m / 2); i < h; i++) {
            f += (this.y[n + i + half] - this.y[n + i]) / half;
          }
          f /= i;
          zy = [];
          for (var i = 0; i <= 3 * m - 1; i++) {
            zy[i] = this.y[n + i] - f * i;
          }
          ny = [];
          for (var i = 0; i <= 3 * m - 1; i++) {
            ny[n + i] = zy[3 * m - i - 1];
            ny[n + 3 * m + i] = zy[i];
            ny[n + 6 * m + i] = zy[3 * m - i - 1];
          }
          // Calculate HTOTDEV
          sum = 0;
          for (var i = n - 3 * m, av1, av2, av3; i <= n + 3 * m - 1; i++) {
            av1 = 0;
            av2 = 0;
            av3 = 0;
            for (var j = 0; j < m; j++) {
              av1 += ny[i + 3 * m + j];
              av2 += ny[i + 3 * m + m + j];
              av3 += ny[i + 3 * m + 2 * m + j];
            }
            av1 /= m;
            av2 /= m;
            av3 /= m;
            v = av1 - 2 * av2 + av3;
            sum += v * v;
          }
          d += sum / 6 * m;
        }
        d /= 6 * (len - 3 * m + 1);
        this.values.htotdev[m] = (n > MIN_SAMPLES) ? Math.sqrt(d): 0;
      }
      return this.values.htotdev[m];
    }
  };

  root['Allan'] = Allan;

})(typeof window!=='undefined' ? window : global);


AllanJS
=======

Frequency Stability Analysis library for JavaScript

Overview
========

AllanJS is a Frequency Stability Analysis library for JavaScript.

A gentle introduction to Frequency Stability Analysis is provided by NIST Special Publication 1065, written by W.J. Riley.

Features
========

Data loading

- Load phase or frequency data from an array.
- Load phase or frequency data from file / URL.

Data preprocessing

- Phase to frequency conversion.
- Frequency to phase conversion.

Frequency Stability Measures

- Maximum, minimum and average for phase and frequency values based on averaging times (tau).
- Original Allan deviation (ADEV).
- Overlapping Allan deviation (OADEV).
- Modified Allan deviation (MDEV).
- Time deviation (TDEV).
- Hadamard deviation (HDEV).
- Overlapping Hadamard deviation (OHDEV).
- Total deviation (TOTDEV).
- Modified Total deviation (MTOTDEV).
- Time Total deviation (TTOTDEV).
- Hadamard Total deviation (HTOTDEV).

Plots

- Phase data plot.
- Frequency data plot.
- Sigma-tau plots of Allan estimators.

How to use it
=============

How to use it

Include AllanJS and Flot + jQuery:

    <script language="javascript" type="text/javascript" src="js/jquery.min.js"></script>
    <script language="javascript" type="text/javascript" src="js/jquery.flot.min.js"></script>
    <script language="javascript" type="text/javascript" src="js/allan.js"></script>

Prepare a data array or file (one value per line):

    var nbs = [ 
      8.920000000000000e+02, 
      8.090000000000000e+02,
      8.230000000000000e+02,
      7.980000000000000e+02,
      6.710000000000000e+02,
      6.440000000000000e+02,
      8.830000000000000e+02,
      9.030000000000000e+02,
      6.770000000000000e+02 
    ];

Create an AllanJS Dataset:

    var allan1 = new Allan.Dataset('example 1');

Load data from array:

    allan1.loadFreqFromArray(nbs);

Get Allan deviation values for tau = 1, 2, 4:

    console.log(allan1.getAdev(1), allan1.getAdev(2), allan1.getAdev(4));

Get Hadamard deviation values for tau = 1, 2, 4:

    console.log(allan1.getHdev(1), allan1.getHdev(2), allan1.getHdev(4));

Generate sigma-tau plot (it will be placed in a div with id='plot1'):

    var plot1 = allan1.getSigmaTauPlot(['ADEV', 'HDEV']);
    $.plot($('#plot1'), plot.values, plot.options);

Acknowledgements
================

This library is based on several Frequency Stability Analysis tools:

- adev3, by Tom Van Baak http://www.leapsecond.com/.
- allan, by Magnus Danielson http://rubidium.dyndns.org/.
- Stable32, by William J. Riley http://www.stable32.com/.
- TimeLab, by John Miles http://www.ke5fx.com/.

Plots are created using Flot, a pure Javascript plotting library for jQuery, by Ole Laursen http://code.google.com/p/flot/.

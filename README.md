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

    Load phase or frequency data from an array.
    Load phase or frequency data from file / URL.

Data preprocessing

    Phase to frequency conversion.
    Frequency to phase conversion.

Frequency Stability Measures

    Maximum, minimum and average for phase and frequency values based on averaging times (tau).
    Original Allan deviation (ADEV).
    Overlapping Allan deviation (OADEV).
    Modified Allan deviation (MDEV).
    Time deviation (TDEV).
    Hadamard deviation (HDEV).
    Overlapping Hadamard deviation (OHDEV).
    Total deviation (TOTDEV).
    Modified Total deviation (MTOTDEV).
    Time Total deviation (TTOTDEV).
    Hadamard Total deviation (HTOTDEV).

Plots

    Phase data plot.
    Frequency data plot.
    Sigma-tau plots of Allan estimators.

Acknowledgements
================

This library is based on several Frequency Stability Analysis tools:

    adev3, by Tom Van Baak http://www.leapsecond.com/.
    allan, by Magnus Danielson http://rubidium.dyndns.org/.
    Stable32, by William J. Riley http://www.stable32.com/.
    TimeLab, by John Miles http://www.ke5fx.com/.

Plots are created using Flot, a pure Javascript plotting library for jQuery, by Ole Laursen http://code.google.com/p/flot/.

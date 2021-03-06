/**
 * Converts a datetime in UTC to the corresponding Julian Date (see AA p60f).
 * @param {moment} datetime Datetime to be converted.
 * @returns {number} Julian date (fractional number of days since 1 January
 *     4713BC according to the proleptic Julian calendar.
 */
const datetimeToJD = function (datetime) {
  let Y = datetime.year();
  // Months are zero-indexed
  let M = datetime.month() + 1;
  const D = datetime.date() + (datetime.hour() + (datetime.minute() +
                               datetime.second() / 60) / 60) / 24;
  if (M < 3) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  // Need a different B if we are before introduction of the Gregorian Calendar
  const gregorianCutoff = moment('1582-10-15T12:00:00Z');
  let B = 0;
  if (datetime.isAfter(gregorianCutoff)) {
    B = 2 - A + Math.floor(A / 4);
  }
  const JD = Math.floor(365.25 * (Y + 4716)) +
             Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
  return JD;
};

/**
 * Converts a Julian Date to the corresponding datetime in UTC (see AA p63).
 * @param {number} JD Julian date to be converted
 * @returns {moment} Datetime corresponding to the given Julian date.
 */
const JDToDatetime = function (JD) {
  JD += 0.5;
  const Z = Math.floor(JD);
  const F = JD - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A += 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const fracDay = B - D - Math.floor(30.6001 * E) + F;
  const day = Math.floor(fracDay);
  const hours = Math.floor((fracDay - day) * 24);
  const minutes = Math.floor(((fracDay - day) * 24 - hours) * 60);
  const seconds =
    Math.floor((((fracDay - day) * 24 - hours) * 60 - minutes) * 60);
  let month = E - 1;
  if (E > 13) {
    month -= 12;
  }
  let year = C - 4715;
  if (month > 2) {
    year -= 1;
  }
  const datetime = moment.tz('2000-01-01T12:00:00', 'UTC');
  datetime.year(year);
  // Months are zero-indexed
  datetime.month(month - 1);
  datetime.date(day);
  datetime.hour(hours);
  datetime.minute(minutes);
  datetime.second(seconds);
  return datetime;
};

/**
 * Converts a Julian date to the number of Julian centuries since
 * 2000-01-01T12:00:00Z (see AA p87 Eq12.1).
 * @param {number} JD Julian date.
 * @returns {number} T.
 */
const JDToT = function (JD) {
  return (JD - 2451545) / 36525;
};

/**
 * Converts a datetime in UTC to the number of Julian centuries since
 * 2000-01-01T12:00:00Z.
 * @param {moment} datetime Datetime to be converted.
 * @returns {number} T.
 */
const datetimeToT = function (datetime) {
  return JDToT(datetimeToJD(datetime));
};

/* eslint-disable complexity */
/**
 * Calculates the value of ΔT=TT−UT (see
 * http://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.htm).
 * @param {moment} datetime Datetime for which ΔT should be calculated.
 * @returns {number} ΔT.
 */
const DeltaT = function (datetime) {
  let y = datetime.year();
  // Months are zero-indexed
  y += (datetime.month() + 0.5) / 12;
  let u;
  let t;
  let DeltaT;
  switch (true) {
    case y < -1999:
      DeltaT = false;
      break;
    case y < -500:
      u = (y - 1820) / 100;
      DeltaT = -20 + 32 * u * u;
      break;
    case y < 500:
      u = y / 100;
      DeltaT = 10583.6 - 1014.41 * u + 33.78311 * u * u - 5.952053 * u * u * u -
               0.1798452 * u * u * u * u + 0.022174192 * u * u * u * u * u +
               0.0090316521 * u * u * u * u * u * u;
      break;
    case y < 1600:
      u = (y - 1000) / 100;
      DeltaT = 1574.2 - 556.01 * u + 71.23472 * u * u + 0.319781 * u * u * u -
               0.8503463 * u * u * u * u - 0.005050998 * u * u * u * u * u +
               0.0083572073 * u * u * u * u * u * u;
      break;
    case y < 1700:
      t = y - 1600;
      DeltaT = 120 - 0.9808 * t - 0.01532 * t * t + t * t * t / 7129;
      break;
    case y < 1800:
      t = y - 1700;
      DeltaT = 8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t * t * t -
               t * t * t * t / 1174000;
      break;
    case y < 1860:
      t = y - 1800;
      DeltaT = 13.72 - 0.332447 * t + 0.0068612 * t * t +
               0.0041116 * t * t * t - 0.00037436 * t * t * t * t +
               0.0000121272 * t * t * t * t * t -
               0.0000001699 * t * t * t * t * t * t +
               0.000000000875 * t * t * t * t * t * t * t;
      break;
    case y < 1900:
      t = y - 1860;
      DeltaT = 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t * t * t -
               0.0004473624 * t * t * t * t + t * t * t * t * t / 233174;
      break;
    case y < 1920:
      t = y - 1900;
      DeltaT = -2.79 + 1.494119 * t - 0.0598939 * t * t +
                0.0061966 * t * t * t - 0.000197 * t * t * t * t;
      break;
    case y < 1941:
      t = y - 1920;
      DeltaT = 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t * t * t;
      break;
    case y < 1961:
      t = y - 1950;
      DeltaT = 29.07 + 0.407 * t - t * t / 233 + t * t * t / 2547;
      break;
    case y < 1986:
      t = y - 1975;
      DeltaT = 45.45 + 1.067 * t - t * t / 260 - t * t * t / 718;
      break;
    case y < 2005:
      t = y - 2000;
      DeltaT = 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t * t * t +
               0.000651814 * t * t * t * t + 0.00002373599 * t * t * t * t * t;
      break;
    case y < 2050:
      t = y - 2000;
      DeltaT = 62.92 + 0.32217 * t + 0.005589 * t * t;
      break;
    case y < 2150:
      DeltaT = -20 + 32 * ((y - 1820) / 100) * ((y - 1820) / 100) -
        0.5628 * (2150 - y);
      break;
    default:
      u = (y - 1820) / 100;
      DeltaT = -20 + 32 * u * u;
  }
  return DeltaT;
};
/* eslint-enable complexity */

/**
 * Calculates an approximate value for k (the fractional number of new moons
 * since 2000-01-06).
 * @param {moment} datetime Datetime for which k is calculated.
 * @returns {number} k.
 */
const approxK = function (datetime) {
  const year = datetime.year() + (datetime.month() + 1) / 12 +
    datetime.date() / 365.25;
  return (year - 2000) * 12.3685;
};

/**
 * Calculates T from k.
 * @param {number} k Fractional number of new moons since 2000-01-06.
 * @returns {number} T Fractional num. of centuries since 2000-01-01:12:00:00Z.
 */
const kToT = function (k) {
  return k / 1236.85;
};

export {datetimeToJD, JDToDatetime, JDToT, datetimeToT, DeltaT, approxK, kToT};

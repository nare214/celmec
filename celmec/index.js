const fs = require("fs");

/**
 * Astronomical constants
 */
class Const {
	/** Obliquity of the ecliptic */
	static e = 23.44;

	/** Number of kilometers in one AU (Astronomical Unit) */
	static kmPerAU = 149597870.7;
}

/**
 * An object representing an enum for the 8 planets of the solar system
 * @enum {number}
 */
const PlanetAbbreviation = {
	/** Mercury */	mer: 1,
	/** Venus */	ven: 2,
	/** Earth */	ear: 3,
	/** Mars */		mar: 4,
	/** Jupiter */	jup: 5,
	/** Saturn */	sat: 6,
	/** Uranus */	ura: 7,
	/** Neptun */	nep: 8
}



/** Data needed to calculate the planet/sun positions using the VSOP87 theory */
let vsop87c_data;

/**
 * Parse raw VSOP87 data and return a well structured object
 * @param {string} data
 * @returns {object}
 */
function parseVSOP87C(data) {
	let res = [ [], [], [] ];

	for (const line of data.trim().split("\n").map(l => l.trim())) {
		if (line.startsWith("VSOP87")) continue;

		const term = {
			ai: line.substring(9, 45).match(/.{1,3}/g).map(x => parseInt(x.trim())),
			s: parseFloat(line.substring(45, 60).trim()),
			k: parseFloat(line.substring(60, 78).trim()),
			a: parseFloat(line.substring(78, 96).trim()),
			b: parseFloat(line.substring(96, 110).trim()),
			c: parseFloat(line.substring(110).trim())
		};

		const variableIndex = parseInt(line[2]);
		const rowIndex = parseInt(line[3]);

		if (res[variableIndex - 1].length === rowIndex) {
			res[variableIndex - 1].push([ term ]);
		} else {
			res[variableIndex - 1][rowIndex].push(term);
		}
	}

	return res;
}

/**
 * Load data for calculating planet/sun position using VSOP87
 * @param {boolean} synchronous
 * @returns {undefined | Promise<undefined>}
 */
function loadVSOP87_data(synchronous = false) {
	if (synchronous) {
		vsop87c_data = JSON.parse(fs.readFileSync(require.resolve("./vsop87c.json"), "utf8"));
		return;
	}

	let promiseResolve, promiseReject;
	const promise = new Promise((resolve, reject) => {
		promiseResolve = resolve;
		promiseReject = reject;
	});
	fs.readFile("./vsop87c.json", "utf8", (err, data) => {
		if (err) {
			promiseReject();
			throw Error("Error when loading VSOP87 data");
		}
		vsop87c_data = JSON.parse(data);
		promiseResolve();
	});
	return promise;
}



/**
 * Calculate sin in degrees
 * @param {number} degrees angle in degrees
 * @returns {number}
 */
function sindeg(degrees) {
	return Math.sin(degrees / 180 * Math.PI);
}
/**
 * Calculate cos in degrees
 * @param {number} degrees angle in degrees
 * @returns {number}
 */
function cosdeg(degrees) {
	return Math.cos(degrees / 180 * Math.PI);
}
/**
 * Calculate tan in degrees
 * @param {number} degrees angle in degrees
 * @returns {number}
 */
function tandeg(degrees) {
	return Math.tan(degrees / 180 * Math.PI);
}

/**
 * Calculate arcsin with degrees as output
 * @param {number} degrees angle in degrees
 * @returns {number}
 */
function asindeg(value) {
	return Math.asin(value) / Math.PI * 180;
}
/**
 * Calculate arccos with degrees as output
 * @param {number} degrees angle in degrees
 * @returns {number}
 */
function acosdeg(value) {
	return Math.acos(value) / Math.PI * 180;
}
/**
 * Calculate arctan with degrees as output
 * @param {number} degrees angle in degrees
 * @returns {number}
 */
function atandeg(value) {
	return Math.atan(value) / Math.PI * 180;
}

/**
 * Calculate sum of the values in an array
 * @param {number[]} array
 * @returns {number}
 */
function sum(array) {
	return array.reduce((partialSum, a) => partialSum + a, 0);
}

/**
 * Append zeros at the beginning and after the decimals in order to reach a certain minimum count of digits
 * @example
 * pad0(5, 2) -> 05
 * pad0(20, 5) -> 00020
 * pad0(1337, 3) -> 1337
 * pad0(3.14, 3, 4) -> 003.1400
 * @param {number} num
 * @param {number} countInt
 * @param {number} countDec
 * @returns {string}
 */
function pad0(num, countInt = 0, countDec = 0) {
	const regexRes = /^(\-)?(\d+)(\.(\d+))?$/.exec(num);
	let int = regexRes?.[2];
	let dec = regexRes?.[4];
	if (int == null) return "NaN";
	int = int.padStart(countInt, "0");
	dec = countDec > 0 && dec == null ? "0".repeat(countDec) : dec?.padEnd(countDec, "0");
	let res = (regexRes[1] === "-" ? "-" : "") + int;
	if (dec != null) res += "." + dec;
	return res;
}



/**
 * Representation of angles with the hour unit system
 * @example
 * 05h 14m 56s -> new HourAngle(5, 14, 56)
 * @link https://en.wikipedia.org/wiki/Angle#Units
 */
class HourAngle {
	hours;
	minutes;
	seconds;

	/**
	 * @param {number} hours
	 * @param {number} minutes
	 * @param {number} seconds
	 */
	constructor(hours, minutes, seconds) {
		this.hours = hours;
		this.minutes = minutes;
		this.seconds = seconds;
	}

	/**
	 * Convert from hour units to degrees
	 * @returns {number}
	 */
	toDegrees() {
		return this.hours * 15 + this.minutes * (15 / 60) + this.seconds * (15 / (60 * 60));
	}

	/**
	 * Convert from degrees to hour units and return the corresponding HourAngle instance
	 * @param {number} degrees
	 * @returns {HourAngle}
	 */
	static fromDegrees(degrees) {
		const pol = degrees >= 0 ? 1 : -1;
		degrees = Math.abs(degrees);
		const hours = Math.floor(degrees / 15);
		degrees -= hours * 15;
		const minutes = Math.floor(degrees / (15 / 60));
		degrees -= minutes * (15 / 60);
		const seconds = degrees / (15 / (60 * 60));
		return new HourAngle(hours * pol, minutes * pol, seconds * pol);
	}
}

/**
 * Representation of angles with the sexagesimal degree unit system
 * @example
 * 245° 14' 56" -> new SexagesimalDegrees(245, 14, 56)
 * @link https://en.wikipedia.org/wiki/Angle#Units
 */
class SexagesimalDegrees {
	degrees;
	minutes;
	seconds;

	/**
	 * @param {number} degrees
	 * @param {number} minutes
	 * @param {number} seconds
	 */
	constructor(degrees, minutes, seconds) {
		this.degrees = degrees;
		this.minutes = minutes;
		this.seconds = seconds;
	}

	/**
	 * Convert from sexagesimal degrees to decimal degrees
	 * @returns {number}
	 */
	toDegrees() {
		return this.degrees + this.minutes / 60 + this.seconds / (60 * 60);
	}

	/**
	 * Convert from decimal degrees to sexagesimal degrees and return the corresponding SexagesimalDegrees instance
	 * @param {number} degrees
	 */
	static fromDegrees(degrees) {
		const pol = degrees >= 0 ? 1 : -1;
		degrees = Math.abs(degrees);
		const fullDegrees = Math.floor(degrees);
		degrees -= fullDegrees;
		const minutes = Math.floor(degrees / (1 / 60));
		degrees -= minutes / 60;
		const seconds = degrees / (1 / (60 * 60));
		return new SexagesimalDegrees(fullDegrees * pol, minutes * pol, seconds * pol);
	}
}

/**
 * Find out more about the Julian Day
 * @link https://en.wikipedia.org/wiki/Julian_day
 */
class JulianDay {
	/**
	 * Calculation of the Julian Day for a certain date and time
	 * @param {number} year
	 * @param {number} month Month of the year (1-12)
	 * @param {number} date Day of the month, if needed with fractions of a day for time representation
	 * @returns {number}
	 */
	static calculate(year, month, date) {
		let y, m, d, b;
		if (month > 2) {
			y = year;
			m = month;
		} else {
			y = year - 1;
			m = month + 12;
		}
		d = date;
		b = 2 - Math.floor(y / 100) + Math.floor(y / 400);
		return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
	}

	/**
	 * Calculate time since 1st Jan 2000 12h in Julian centuries
	 * @param {number} julianDay
	 */
	static calculateJulianCenturiesJ2000(julianDay) {
		return (julianDay - 2451545) / 36525;
	}

	/**
	 * Calculate time since 1st Jan 2000 12h in Julian millennia
	 * @param {number} julianDay
	 */
	static calculateJulianMillenniaJ2000(julianDay) {
		return (julianDay - 2451545) / 365250;
	}
}

/**
 * If you want to learn more about the sidereal time, visit:
 * @link https://en.wikipedia.org/wiki/Sidereal_time
 */
class SiderealTime {
	/**
	 * Calculate the sidereal time for a certain geographical longitude and time
	 * @param {number} geoLongitude Geographic longitude of the observer
	 * @param {Date} dateTime
	 * @returns {HourAngle}
	 */
	static calculate(geoLongitude, dateTime = new Date()) {
		const year = dateTime.getUTCFullYear();
		const month = dateTime.getUTCMonth() + 1;
		const date = dateTime.getUTCDate();
		const hours = dateTime.getUTCHours();
		const minutes = dateTime.getUTCMinutes();
		const seconds = dateTime.getUTCSeconds();
		const milliseconds = dateTime.getUTCMilliseconds();

		const JD = JulianDay.calculate(year, month, date);
		const T = JulianDay.calculateJulianCenturiesJ2000(JD);
		const siderealTimeGreenwichMidnight = 100.46061837 + 36000.770053608 * T + 0.000387933 * T**2 - (T**3 / 38710000);
		const siderealTimeGreenwich = siderealTimeGreenwichMidnight + new HourAngle(hours, minutes, seconds + milliseconds / 1000).toDegrees() * 1.00273790935;
		const siderealTimeLocal = (siderealTimeGreenwich + geoLongitude) % 360;

		return HourAngle.fromDegrees(siderealTimeLocal);
	}
}



/**
 * The equatorial coordinate system is explained here:
 * @link https://en.wikipedia.org/wiki/Equatorial_coordinate_system
 */
class Equatorial {
	rightAscension;
	declination;

	/**
	 * @param {number} rightAscension
	 * @param {number} declination
	 */
	constructor(rightAscension, declination) {
		this.rightAscension = rightAscension;
		this.declination = declination;
	}

	/**
	 * Convert from equatorial to azimuthal coordinates
	 * @param {number} geoLatitude Geographic latitude of the observer
	 * @param {number} geoLongitude Geographic longitude of the observer
	 * @param {Date} dateTime
	 * @returns {Azimuthal}
	 */
	toAzimuthal(geoLatitude, geoLongitude, dateTime = new Date()) {
		const siderealTime = SiderealTime.calculate(geoLongitude, dateTime);
		const siderealTimeDegrees = siderealTime.toDegrees();
		const height = asindeg(
			sindeg(geoLatitude) * sindeg(this.declination)
			+ cosdeg(geoLatitude) * cosdeg(this.declination)
			* cosdeg(siderealTimeDegrees - this.rightAscension)
		);
		const azimuthAtan = atandeg(
			sindeg(siderealTimeDegrees - this.rightAscension)
			/ (
				sindeg(geoLatitude) * cosdeg(siderealTimeDegrees - this.rightAscension)
				- cosdeg(geoLatitude) * tandeg(this.declination)
			)
		);
		const azimuthOption1 = azimuthAtan < 0 ? azimuthAtan + 360 : azimuthAtan;
		const azimuthOption2 = azimuthOption1 >= 180 ? azimuthOption1 - 180 : azimuthOption1 + 180;
		const quadrant = Math.floor((siderealTimeDegrees - this.rightAscension) / 90);
		let azimuth =
			Math.floor(azimuthOption1 / 90) === quadrant ? azimuthOption1 : azimuthOption2;
		
		// Return azimuth with north as reference instead of south
		azimuth = Azimuthal.toggleAzimuthReferencePoint(azimuth);

		return new Azimuthal(azimuth, height, dateTime);
	}
}

/**
 * Check out about the azimuthal system (also known as horizontal system):
 * @link https://en.wikipedia.org/wiki/Horizontal_coordinate_system
 */
class Azimuthal {
	azimuth;
	height;

	/** The datetime to which the coordinates refer */
	dateTime;

	/**
	 * @param {number} azimuth
	 * @param {number} height
	 * @param {Date} dateTime The datetime to which the coordinates refer
	 */
	constructor(azimuth, height, dateTime = new Date()) {
		this.azimuth = azimuth;
		this.height = height;
		this.dateTime = dateTime;
	}

	/**
	 * Convert from azimuthal to equatorial coordinates
	 * @param {number} geoLatitude Geographic latitude of the observer
	 * @param {number} geoLongitude Geographic longitude of the observer
	 * @returns {Equatorial}
	 */
	toEquatorial(geoLatitude, geoLongitude) {
		const siderealTime = SiderealTime.calculate(geoLongitude, this.dateTime);
		const siderealTimeDegrees = siderealTime.toDegrees();

		// For calculations, use south as reference instead of north
		const azimuthFromSouth = Azimuthal.toggleAzimuthReferencePoint(this.azimuth);

		const declination = asindeg(
			sindeg(geoLatitude) * sindeg(this.height)
			- cosdeg(geoLatitude) * cosdeg(this.height) * cosdeg(azimuthFromSouth)
		);
		const hourAngleAtan = atandeg(
			sindeg(azimuthFromSouth)
			/ (
				sindeg(geoLatitude) * cosdeg(azimuthFromSouth)
				+ cosdeg(geoLatitude) * tandeg(this.height)
			)
		);
		const hourAngleOption1 = hourAngleAtan < 0 ? hourAngleAtan + 360 : hourAngleAtan;
		const hourAngleOption2 = hourAngleOption1 >= 180 ? hourAngleOption1 - 180 : hourAngleOption1 + 180;
		const quadrant = Math.floor(azimuthFromSouth / 90);
		const hourAngle =
			Math.floor(hourAngleOption1 / 90) === quadrant ? hourAngleOption1 : hourAngleOption2;

		const rightAscension = siderealTimeDegrees - hourAngle;
		return new Equatorial(rightAscension < 0 ? rightAscension + 360 : rightAscension, declination);
	}

	/**
	 * Use north as reference instead of south and vice-versa
	 * @param {number} azimuth
	 * @returns {number}
	 */
	static toggleAzimuthReferencePoint(azimuth) {
		azimuth = azimuth + 180;
		if (azimuth >= 360) {
			azimuth -= 360;
		}
		return azimuth;
	}
}

/**
 * Find out about the heliocentric cartesian system:
 * @link https://en.wikipedia.org/wiki/Ecliptic_coordinate_system#Rectangular_coordinates
 */
class HeliocentricCartesian {
	x;
	y;
	z;
	dateTime;

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {Date} dateTime
	 */
	constructor(x, y, z, dateTime) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.dateTime = dateTime;
	}

	/**
	 * Convert from heliocentric to geocentric cartesian coordinates
	 * @returns {GeocentricCartesian}
	 */
	toGeocentricCartesian() {
		const earthCoords = new Planet(PlanetAbbreviation.ear).calculateHeliocentricCartesian(this.dateTime);
		const xObject = this.x - earthCoords.x;
		const yObject = this.y - earthCoords.y;
		const zObject = this.z - earthCoords.z;
		return new GeocentricCartesian(xObject, yObject, zObject, this.dateTime);
	}
}

/**
 * Basically the same as heliocentric cartesian coordinates, but with the earth instead of the sun in its center
 */
class GeocentricCartesian {
	x;
	y;
	z;
	dateTime;

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {Date} dateTime;
	 */
	constructor(x, y, z, dateTime) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.dateTime = dateTime;
	}

	/**
	 * Convert from geocentric to heliocentric cartesian coordinates
	 * @returns {HeliocentricCartesian}
	 */
	toHeliocentricCartesian() {
		const earthCoords = new Planet(PlanetAbbreviation.ear).calculateHeliocentricCartesian(this.dateTime);
		const xPlanet = this.x + earthCoords.x;
		const yPlanet = this.y + earthCoords.y;
		const zPlanet = this.z + earthCoords.z;
		return new HeliocentricCartesian(xPlanet, yPlanet, zPlanet, this.dateTime);
	}

	/**
	 * Convert from geocentric cartesian to spherical ecliptical coordinates
	 * @returns {Ecliptical}
	 */
	toEcliptical() {
		let longitude = Math.atan2(this.y, this.x) / Math.PI * 180;
		let latitude = atandeg(this.z / Math.sqrt(this.x**2 + this.y**2));
		return new Ecliptical(longitude, latitude, this.dateTime);
	}
}

/**
 * The spherical ecliptical coordinate system is described on wikipedia:
 * @link https://en.wikipedia.org/wiki/Ecliptic_coordinate_system#Spherical_coordinates
 */
class Ecliptical {
	longitude;
	latitude;
	dateTime;

	/**
	 * @param {number} longitude
	 * @param {number} latitude
	 * @param {Date} dateTime
	 */
	constructor(longitude, latitude, dateTime) {
		this.longitude = longitude;
		this.latitude = latitude;
		this.dateTime = dateTime;
	}

	/**
	 * Convert from spherical ecliptical to equatorial coordinates
	 * @returns {Equatorial}
	 */
	toEquatorial() {
		const declination = asindeg(
			cosdeg(Const.e) * sindeg(this.latitude)
			+ sindeg(Const.e) * cosdeg(this.latitude) * sindeg(this.longitude)
		);
		let rightAscension;
		if (this.longitude !== 90 && this.longitude !== 270) {
			const rightAscensionAtan = atandeg(
				(cosdeg(Const.e) * sindeg(this.longitude) - sindeg(Const.e) * tandeg(this.latitude))
				/ cosdeg(this.longitude)
			);
			const rightAscensionOption1 = rightAscensionAtan < 0 ? rightAscensionAtan + 360 : rightAscensionAtan;
			const rightAscensionOption2 = rightAscensionOption1 >= 180 ? rightAscensionOption1 - 180 : rightAscensionOption1 + 180;
			let quadrant = Math.floor(this.longitude / 90);
			quadrant = quadrant < 0 ? quadrant + 4 : quadrant;
			rightAscension = Math.floor(rightAscensionOption1 / 90) === quadrant ? rightAscensionOption1 : rightAscensionOption2;
		} else {
			rightAscension = this.longitude;
		}

		return new Equatorial(rightAscension < 0 ? rightAscension + 360 : rightAscension, declination);
	}
}



class Star {
	rightAscension;
	declination;

	/**
	 * @param {number} rightAscension
	 * @param {number} declination
	 */
	constructor(rightAscension, declination) {
		this.rightAscension = rightAscension;
		this.declination = declination;
	}

	/**
	 * Calculate azimuthal position of the star
	 * @param {number} geoLatitude Geographic latitude of the observer
	 * @param {number} geoLongitude Geographic longitude of the observer
	 * @param {Date} dateTime
	 * @returns {Azimuthal}
	 */
	calculateAzimuthal(geoLatitude, geoLongitude, dateTime = new Date()) {
		return new Equatorial(this.rightAscension, this.declination)
			.toAzimuthal(geoLatitude, geoLongitude, dateTime);
	}
}

class Planet {
	/** A number indicating which planet from PlanetAbbreviation to use */
	planet;

	/**
	 * @param {number} planet A number indicating which planet from PlanetAbbreviation to use
	 */
	constructor(planet) {
		this.planet = planet;
	}

	/**
	 * Calculate heliocentric cartesian position of the planet
	 * @param {Date} dateTime
	 * @returns {HeliocentricCartesian}
	 */
	calculateHeliocentricCartesian(dateTime = new Date()) {
		const year = dateTime.getUTCFullYear();
		const month = dateTime.getUTCMonth() + 1;
		const hours = dateTime.getUTCHours();
		const minutes = dateTime.getUTCMinutes();
		const seconds = dateTime.getUTCSeconds();
		const milliseconds = dateTime.getUTCMilliseconds();
		
		const date = dateTime.getUTCDate() + hours / 24 + minutes / 60 / 24 + seconds / 60 / 60 / 24 + milliseconds / 1000 / 60 / 60 / 24;

		const JD = JulianDay.calculate(year, month, date);
		const T = JulianDay.calculateJulianMillenniaJ2000(JD);

		const planetName = Object.entries(PlanetAbbreviation).find(x => x[1] === this.planet)[0];
		if (vsop87c_data == undefined) {
			throw Error("Trying to access undefined variable vsop87c_data: Call loadVSOP87_data() before calculating planet/sun position");
		}
		const data = vsop87c_data[planetName];
		let xyz = [];

		for (const rows of data) {
			let series = [];
			for (const row of rows) {
				const terms = row.map(term => term.a * Math.cos(term.b + term.c * T));
				series.push(sum(terms));
			}
			const variable = series.reduce((partialSum, currVal, i) => partialSum + currVal * T**i, 0);
			xyz.push(variable);
		}

		return new HeliocentricCartesian(...xyz, dateTime);
	}

	/**
	 * Calculate equatorial position of the planet
	 * @param {Date} dateTime
	 * @returns {Equatorial}
	 */
	calculateEquatorial(dateTime = new Date()) {
		return this.calculateHeliocentricCartesian(dateTime)
			.toGeocentricCartesian().toEcliptical().toEquatorial();
	}

	/**
	 * Calculate azimuthal position of the planet
	 * @param {number} geoLatitude Geographic latitude of the observer
	 * @param {number} geoLongitude Geographic longitude of the observer
	 * @param {Date} dateTime
	 * @returns {Azimuthal}
	 */
	calculateAzimuthal(geoLatitude, geoLongitude, dateTime = new Date()) {
		return this.calculateEquatorial(dateTime).toAzimuthal(geoLatitude, geoLongitude, dateTime);
	}
}

class Sun {
	/**
	 * Calculate geocentric cartesian position of the sun
	 * @param {Date} dateTime
	 * @returns {GeocentricCartesian}
	 */
	static calculateGeocentricCartesian(dateTime = new Date()) {
		return new HeliocentricCartesian(0, 0, 0, dateTime).toGeocentricCartesian();
	}

	/**
	 * Calculate azimuthal position of the sun
	 * @param {number} geoLatitude Geographic latitude of the observer
	 * @param {number} geoLongitude Geographic longitude of the observer
	 * @param {Date} dateTime
	 * @returns {Azimuthal}
	 */
	static calculateAzimuthal(geoLatitude, geoLongitude, dateTime = new Date()) {
		let azimuthalPos = this.calculateGeocentricCartesian(dateTime).toEcliptical().toEquatorial().toAzimuthal(geoLatitude, geoLongitude, dateTime);
		azimuthalPos.azimuth = Azimuthal.toggleAzimuthReferencePoint(azimuthalPos.azimuth);
		return azimuthalPos;
	}
}



module.exports = {
	Const, PlanetAbbreviation, loadVSOP87_data, sindeg, cosdeg, tandeg,
	asindeg, acosdeg, atandeg, sum, pad0, HourAngle, SexagesimalDegrees,
	JulianDay, SiderealTime, Equatorial, Azimuthal, HeliocentricCartesian,
	GeocentricCartesian, Ecliptical, Star, Planet, Sun
}
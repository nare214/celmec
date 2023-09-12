const celmec = require("../celmec");

let azimuthalPos, azimuth, height;
celmec.loadVSOP87_data(true);



/*
	Example 1:
		Calculate azimuthal position of vega
		(the fifth-brightest star in the night sky)
*/

// Create Star object for vega using equatorial positions from wikipedia
const vega = new celmec.Star(
	new celmec.HourAngle(18, 36, 56.34).toDegrees(),
	new celmec.SexagesimalDegrees(38, 47, 1.3).toDegrees()
);

// Calculate azimuthal position for Munich, Germany (48° 8' 13.92" N 11° 34' 31.8" E)
azimuthalPos = vega.calculateAzimuthal(48.1372, 11.5755);
azimuth = azimuthalPos.azimuth;
height = azimuthalPos.height;

console.log(`
	Example 1:
	Azimuthal position of vega:
	azimuth: ${azimuth}
	height: ${height}
`);



/*
	Example 2:
		Calculate azimuthal position of saturn
*/

// Create Planet object for saturn
const saturn = new celmec.Planet(celmec.PlanetAbbreviation.sat);

// Calculate azimuthal position for Munich, Germany (48° 8' 13.92" N 11° 34' 31.8" E)
azimuthalPos = saturn.calculateAzimuthal(48.1372, 11.5755);
azimuth = azimuthalPos.azimuth;
height = azimuthalPos.height;

console.log(`
	Example 2:
	Azimuthal position of saturn:
	azimuth: ${azimuth}
	height: ${height}
`);



/*
	Example 3:
		Calculate azimuthal position of the sun
*/

azimuthalPos = celmec.Sun.calculateAzimuthal(48.1372, 11.5755);
azimuth = azimuthalPos.azimuth;
height = azimuthalPos.height;

console.log(`
	Example 3:
	Azimuthal position of the sun:
	azimuth: ${azimuth}
	height: ${height}
`);



/*
	Example 4:
		Convert azimuthal to equatorial coordinates
*/

azimuth = 137;
height = 23;
azimuthalPos = new celmec.Azimuthal(azimuth, height);
const equatorialPos = azimuthalPos.toEquatorial(48.1372, 11.5755);
const rightAscension = equatorialPos.rightAscension;
const declination = equatorialPos.declination;

console.log(`
	Example 4:
	Azimuthal to equatorial
	azimuth: ${azimuth}
	height: ${height}
	rightAscension: ${rightAscension}
	declination: ${declination}
`);
# celmec
## About
With this package, you can calculate the real-time positions of the sun, all planets and every star/deep-sky object at the sky completely client-side.

## How to use
### For stars
First, find the `rotating equatorial coordinates` of the star. They can be divided into two parts: `right ascension (RA)` and `declination (Dec)`. You can look them up on wikipedia. It should look similar to this:
```
RA:  18h 37m 44.7s
Dec: 38° 48' 33.0"
```
Next, create a new instance of the `Star` class. Use RA and Dec of the star in degrees as parameters in the constructor.
If the coordinates are given in hour angles or sexagesimal degrees, use `new HourAngle(hours, minutes, seconds).toDegrees()` or `new SexagesimalDegrees(degrees, minutes, seconds).toDegrees()`.

&nbsp;&nbsp;&nbsp;See also: [Angle Units (Wikipedia)](https://en.wikipedia.org/wiki/Angle#Units)

Now, use RA and Dec (both in degrees) to create a new Star object:
```
const star = new Star(RA, Dec);
```
Finally, calculate azimuth and height. You'll need the geographic latitude and longitude.
```
const azimuthalPosition = star.calculateAzimuthal(latitude, longitude);
const azimuth = azimuthalPosition.azimuth;
const height = azimuthalPosition.height;
```

### For planets
Create a new instance of the `Planet` class. In this example, it's Saturn, but you can use any planet from the object `PlanetAbbreviation`.
```
const saturn = new Planet(PlanetAbbreviation.sat);
```
Calculate azimuth and height by calling the method `calculateAzimuthal(latitude, longitude)`:
```
const azimuthalPosition = saturn.calculateAzimuthal(latitude, longitude);
const azimuth = azimuthalPosition.azimuth;
const height = azimuthalPosition.height;
```

### For the sun
Call `Sun.calculateAzimuthal(latitude, longitude)`:
```
const azimuthalPosition = Sun.calculateAzimuthal(latitude, longitude);
const azimuth = azimuthalPosition.azimuth;
const height = azimuthalPosition.height;
```

## NPM Package
[https://www.npmjs.com/package/celmec](https://www.npmjs.com/package/celmec)
Urandium Server API
===================

Uploading photos
----------------

Endpoint: `POST /photo` 

Parameters: 

- latLng: comma separated string of latitude and longitude values (optional)
- type: 'raw' or 'final'. raw for photos from the iphone camera. final for mixed photos
- imageData: base64 encoded string of the JPEG encoded image

returns:

HTTP 200 with `photoId` in JSON.

Obtaining a photo to mix
----------------------

Endpoint: `GET /photo`

Parameters:

- latLng: comma separated string of latitude and longitude values (optional)
- TBD

returns: 

HTTP 200 and the JPEG encoded image.


Obtaining the last N mixed photos for photo stream
---------------------------------------------------

Endpoint: `GET /photo/stream`

Parameters:

- latLng: comma separated string of latitude and longitude values (optional)
- TBD

returns: 

HTTP 200 and a JSON array containing the URLs to the photo stream images.





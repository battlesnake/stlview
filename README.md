STL viewer experiment
=====================

Test project for webapp idea

Requires for front-end
----------------------

 * AngularJS

Build environment requirements
------------------------------

 * Linux or similar

 * Node.js

 * Gulp (installed globally, `npm install -g gulp`)

Running
-------

	npm install

	gulp build

	gulp serve

Then open your browser to `http://localhost:3000`.

Credits
-------

`ship.stl` was downloaded from `http://www.eng.nus.edu.sg/LCEL/RP/u21/wwwroot/stl_library.htm`

It was converted to ASCII format using `stl.js`.

Bugs
----

`stl.js` doesn't load binary STL files correctly in front-end.  Possibly a
limitation of browserify's Buffer shim, or maybe a bug in `stl.js`, as I haven't
verified the accuracy of its binary parsing on the backend.


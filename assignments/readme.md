# Visualization Assignments

## Running the code
The code for this assignment can be found under the
`assignment1` directory.
The `public` directory contains the static assets.
The scripts are written in TypeScript and styles in SASS.
Therefore, they need appropriate tool support to run.
In the following section, I will demonstrate several ways
to run the code.

### On live server
The easiest way to see the assignment is to visit
https://visass.parvezmrobin.com.

### Running locally

The `dist` directory contains the compiled script, markup,
and style files.
The files are built targeting ′chrome89‘, ′edge89‘ ‘firefox89‘, 
and ′safari15‘.
The codebase uses top-level `await` functionality which was
not available before chrome89.
Simply, running a web-server with `dist` as root directory,
will show the assignment result.

### Running dev server

To directly run the code, you need to install the toolset and
start the server.
To do so, run the following commands.

```shell
yarn install # to install the necessary packages
yarn dev # to run the dev server
```
You are all set. Now just visit http://localhost:3000.
This dev server has hot module reload (HMR) integrated.
Thus, if you change anything, it will automatically be
changed in the browser even without any reload.

## Interactivity

Upon clicking any SVG element (except `image`), a popup
will be shown which will facilitate changing color of that
SVG element.
Clicking outside any SVG element will close that popup.

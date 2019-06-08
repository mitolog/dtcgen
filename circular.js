const madge = require('madge');

madge('./dist/cli-app/index.js').then((res) => {
	console.log(res.circular());
});

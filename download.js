var request = require('request'),
    fs = require('fs'),
    ProgressBar = require('progress'),
    util = require('util'),
    del = require('del');

var gist = 'https://gist.githubusercontent.com/jlis/2ae7edc5b628771e8ee6da210eb25b58/raw?' + Math.floor(Date.now() / 1000);
var cacheFolder = './cache/';
var viewerTemplate = './viewer_template.html';
var viewerRendered = './viewer.html';

console.log('Start downloading from: ' + gist);

request(gist, (err, resp, body) => {
    if (err) throw err;

    let cache = [];
    let json = JSON.parse(body);

    let bar = new ProgressBar('Downloading [:bar] :current/:total', {
        total: json.length
    });

    json.forEach((url, index) => {
        url = url.replace('.gif', '.mp4');
        let filename = slugify(url) + '.mp4';
        fs.exists(cacheFolder + filename, (exists) => {
            if (exists) {
                bar.tick();
                cache.push(filename);

                if (bar.complete) createViewer(cache);

                return;
            }

            let stream = request(url).pipe(fs.createWriteStream(cacheFolder + filename));

            stream.on('finish', () => {
                bar.tick();
                cache.push(filename);

                if (bar.complete) createViewer(cache);
            });
        });
    }, this);
});

var createViewer = function(cache) {
    let template = fs.readFileSync(viewerTemplate);
    let search = 'alert(\'missing files\');';
    let replace = util.format('var files = %s;', JSON.stringify(cache));

    fs.writeFileSync(viewerRendered, template.toString().replace(search, replace));
    console.log('Viewer generated: ' + viewerRendered);

    deleteRemovedImages(cache);
}

var deleteRemovedImages = function(cache) {
    let pattern = [];

    cache.forEach((entry, index) => {
        pattern.push('!' + cacheFolder + entry);

        if ((cache.length - 1) === index) {
            del([cacheFolder + '*.mp4'].concat(pattern)).then(paths => {
                if (paths.length > 0) console.log(util.format('Deleted %d removed files...', paths.length));
            });
        }
    });
}

var slugify = function(url) {
    url = url.replace(/https?:\/\//g, '');
    return url.replace(/[.\/]/g, '-');
}

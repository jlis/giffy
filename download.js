var request = require('request'),
    crypto = require('crypto'),
    fs = require('fs'),
    ProgressBar = require('progress'),
    del = require('del'),
    util = require('util');

var gist = 'https://gist.githubusercontent.com/jlis/2ae7edc5b628771e8ee6da210eb25b58/raw?' + Math.floor(Date.now() / 1000);
var cacheFolder = './cache/';
var viewerTemplate = './viewer_template.html';
var viewerRendered = './viewer.html';

del([cacheFolder + '*.gif', viewerRendered]).then(paths => {
    console.log('Purged the cache...');
    console.log('Start downloading from: ' + gist);

    request(gist, (err, resp, body) => {
        if (err) throw err;

        let cache = [];
        let json = JSON.parse(body);

        let bar = new ProgressBar('Downloading [:bar] :current/:total', { total: json.length });

        json.forEach(function (url, index) {
            let filename = crypto.createHash('md5').update(url).digest('hex') + '.gif';
            request(url)
                .on('response', (err) => {
                    bar.tick();
                    cache.push(filename);

                    if (bar.complete) {
                        let template = fs.readFileSync(viewerTemplate);
                        let search = 'alert(\'missing gifs\');';
                        let replace = util.format('var gifs = %s;', JSON.stringify(cache));
        
                        fs.writeFileSync(viewerRendered, template.toString().replace(search, replace));
                        console.log('Viewer generated: ' + viewerRendered);
                    }
                })
                .pipe(fs.createWriteStream(cacheFolder + filename));
        }, this);
    });
});



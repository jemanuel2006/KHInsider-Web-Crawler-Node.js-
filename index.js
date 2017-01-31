var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var cors = require('cors')
var fs = require('fs');

var app = express();

 var trackObjects = [];


function getAllSongsUrls(){
    //var letters = ['%23', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 
    //'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X','Y', 'Z'];
    var letters = ['I'];
    var browseUrl = 'http://downloads.khinsider.com/game-soundtracks/browse/';

    for(var i = 0; i < letters.length; i++){
        currentLetterUrl = browseUrl + letters[i];
        
        //List request
        request(getRequestOption(currentLetterUrl), function(err, res, body) {
            var $ = cheerio.load(body);
            $('#EchoTopic > p ~ p > a').each(function(){
                var link = $(this).attr('href');
                var albumName = $(this).html();

                var currentAlbumObject = {
                    albumName : albumName,
                    albumUrl : link,
                    tracks : []
                }; 

                //Single album request
                request(getRequestOption(link), function(err, res, body) {
                    var albumBody = cheerio.load(body);

                    albumBody('a').each(function(i, elem){
                            var mp3Url = albumBody(this).attr('href');
                            var songName = albumBody(this).html();

                            if(mp3Url.toLowerCase().includes(link) == false || songName == "Download")
                                return;

                            //Mp3 download request
                            request(getRequestOption(mp3Url), function(err, res, body){
                                var mp3DownloadBody = cheerio.load(body);
                                var mp3Url = mp3DownloadBody('audio').attr('src');

                                var songInfo = {
                                    songName : songName,
                                    url : mp3Url
                                };

                                currentAlbumObject.tracks.push(songInfo);
                                fs.writeFileSync('songs.json', JSON.stringify(trackObjects));
                            });
                        });
                });

                trackObjects.push(currentAlbumObject);
            });
        });
    }

    return trackObjects;
}

app.use(cors());

function getRequestOption(url){
    return {
        uri: url,
        method:'GET',
        headers: {
            'Proxy-Connection' : 'keep-alive',
            'Upgrade-Insecure-Requests' : '1'
        },
        forever:true
    };
}

app.get('/gettracks', function (req, res) {
    if(fs.existsSync('songs.json')){
        var jsonObject = fs.readFileSync('songs.json').toString();
        res.send(JSON.parse(jsonObject));
    } else {
        res.send({});
    }
});

app.get('/start', function(req, res){
    getAllSongsUrls();
    res.redirect('/gettracks');
});

var port = process.env.PORT || 8080;

app.listen(port, function () {
    console.log('Listening on ' + port);
});
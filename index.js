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
        request(currentLetterUrl, function(err, res, body) {
            var $ = cheerio.load(body);
            $('#EchoTopic > p ~ p > a').each(function(){
                var link = $(this).attr('href');
                var albumName = $(this).val();

                var currentAlbumObject = {
                    albumName : albumName,
                    albumUrl : link,
                    tracks : []
                }; 

                //Single album request
                request(currentLetterUrl, function(err, res, body) {
                    var firstElement = true;
                    var albumBody = cheerio.load(body);

                    $('#EchoTopic > table > tbody > tr').each(function(){
                        if(firstElement == false){
                            var mp3Url = albumBody(this).find('td > a').attr('href');
                            var songName = albumBody(this).find('td > a').val();

                            //Mp3 download request
                            request(mp3Url, function(err, res, body){
                                var mp3DownloadBody = cheerio.load(body);
                                var mp3Url = mp3DownloadBody(this).find('#EchoTopic > audio').attr('src');

                                var songInfo = {
                                    songName : songName,
                                    url : mp3Url
                                };

                                currentAlbumObject.tracks.push(songInfo);
                            });
                        } 
                        else {
                            firstElement = false;
                        }
                    });
                });

                trackObjects.push(currentAlbumObject);
            });
        });
    }

    return trackObjects;
}

app.use(cors());

app.get('/', function (req, res) {
    getAllSongsUrls();
    res.send(trackObjects);
});

app.use('/api', express.static(__dirname));

var port = process.env.PORT || 8080;

app.listen(port, function () {
    console.log('Listening on ' + port);
});
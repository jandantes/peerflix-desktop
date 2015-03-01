'use strict';

var address = require('network-address');
var readTorrent = require('read-torrent');
var peerflix = require('peerflix');

var app = angular.module('PeerFlixDesktop', ['ngMaterial']);


// https://gist.github.com/thomseddon/3511330
app.filter('bytes', function() {
    return function(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
            number = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
    };
});

app.controller('AppCtrl', ['$rootScope', '$scope', function($rootScope, $scope) {

    $scope.opt = {
        serverstarted: false,
        nowplaying: false,
        isloading: false,
        error: false
    };

    var isLoaded = function(status, file) {
        $scope.$apply(function() {
            if (status) {
                $scope.url = file.href;
                $scope.filename = file.filename;
                $scope.filelength = file.filelength;
                $scope.opt.isloading = false;
                $scope.opt.nowplaying = true;

            } else {
                $scope.url = '';
                $scope.opt.isloading = false;
                $scope.opt.nowplaying = false;
                $scope.opt.serverstarted = false;
            }
        });
    };

    var hasError = function(status, message) {
        $scope.$apply(function() {
            $scope.opt.isloading = false;
            $scope.opt.serverstarted = false;
            $scope.errorMessage = message;
            if (status) {
                $scope.opt.error = status;
            } else {
                $scope.opt.error = status;
            }
        });
    };

    $scope.startStream = function() {
        $scope.opt.serverstarted = true;
        $scope.opt.isloading = true;
        if (/^magnet:/.test($scope.link)) {
            ontorrent($scope.link);
        } else {
            readTorrent($scope.link, function(err, torrent, raw) {
                if (err) {
                    hasError(true, err.message);
                    console.log(err.message);
                } else {
                    hasError(false);
                    ontorrent(raw);
                }
            });
        }
    };

    $scope.stopStream = function() {
        $scope.opt.serverstarted = true;
        $scope.opt.isloading = true;
        $scope.stopServer();
    };

    var ontorrent = function(torrent) {
        var argv = {
            connections: 100,
            port: 2023,
            index: null,
            list: false,
            subtitles: true,
            quiet: true,
            vlc: false,
            mplayer: false,
            smplayer: false,
            mpchc: false,
            potplayer: false,
            mpv: false,
            omx: false,
            webplay: false,
            jack: false,
            path: null,
            blocklist: null,
            noquit: false,
            all: false,
            remove: true,
            hostname: null,
            peer: null,
            peerport: null,
            nontontop: false
        };
        var engine = peerflix(torrent, argv); //arguments
        var hotswaps = 0;
        var verified = 0;
        var invalid = 0;
        var host = argv.hostname || address();
        var href = 'http://' + host + ':' + argv.port + '/';
        var filename = engine.server.index.name.split('/').pop().replace(/\{|\}/g, '');
        var filelength = engine.server.index.length;

        $scope.filename = filename;
        $scope.filelength = filelength;

        engine.on('verify', function() {
            verified++;
        });

        engine.on('invalid-piece', function() {
            invalid++;
        });

        engine.on('hotswap', function() {
            hotswaps++;
        });

        engine.server.on('listening', function() {
            var file = {
                href: href,
                filename: filename,
                filelength: filelength
            };
            isLoaded(true, file);
        });

        engine.server.once('error', function() {
            engine.server.listen(0, host);
        });

        $scope.stopServer = function() {

            engine.remove(function() {
                console.log('Clean up');
                engine.destroy(function() {
                    console.log('Exiting');
                    isLoaded(false);
                    engine.server.close();
                });
            });
        };

    };

}]);

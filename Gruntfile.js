module.exports = function(grunt) {
    grunt.initConfig({
        nodewebkit: {
            options: {
                buildDir: '../dist',
                platforms: ['win','linux'],
                appName: 'Peerflix Desktop',
                appVersion: '0.0.1'
            },
            src: ['./app/**/*']
        }
    });
    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.registerTask('default', ['nodewebkit']);
};

/*
 Copyright 2019 Jason Drake (jadrake75@gmail.com)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
const {spawn} = require('child_process');
const _ = require('lodash');

let processHandler = function () {
    "use strict";

    function logMessage(data, err = false) {
        console.log(data);
    }

    function configureStreams(process) {
        process.stdout.setEncoding('utf8');
        process.stderr.setEncoding('utf8');

        process.stdout.on('data', data => {
            logMessage(data);
        });
        process.stderr.on('data', data => {
            logMessage(data, true);
        });
    }

    return {
        processes: {},

        start: function(uuid, port, callback) {
            let cmdLine = ['-jar', 'lib/stamp-imageparsing-3.0.0-SNAPSHOT.jar', '--apiKey="' + uuid + '"' ,'--server.port=' + port];
            console.log(cmdLine);
            let process = spawn('javaw', cmdLine);

            _.set(this.processes, process.pid, process);
            configureStreams(process);

            process.on('exit', code => {
                _.unset(this.processes, process.pid);
                callback('exit');
            });
            callback('started', {pid: process.pid});
        },

        stop(pid) {
            let process = _.get(this.processes, pid);
            if (process) {
                process.stdin.pause();
                process.kill();
            }
        }


    };
}();

module.exports = processHandler;


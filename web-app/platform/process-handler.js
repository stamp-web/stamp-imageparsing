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
const util = require('util');
const _ = require('lodash');
const pexec = util.promisify(require('child_process').exec);
const path = require('path')

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

        start: function(uuid, port, config, callback) {
            let microserviceLib = _.get(config, 'microserviceLib', 'lib/stamp-imageparsing-3.0.0-SNAPSHOT.jar');
            let javaRuntime = _.get(config, 'jvmPath');
            let javaCmd = (javaRuntime) ? `${javaRuntime}/bin/javaw` : 'javaw';
            let cmdLine = ['-jar', 'lib/stamp-imageparsing-3.0.0-SNAPSHOT.jar', '--apiKey="' + uuid + '"' ,'--server.port=' + port];
            console.log(cmdLine);
            let process = spawn(javaCmd, cmdLine);

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
        },

        checkJava(options) {
            const javaRuntime = _.get(options, 'jvmPath');
            const javaCmd = (javaRuntime) ? path.join(javaRuntime, 'bin', 'javaw') : 'javaw';
            return new Promise((resolve, reject) => {
                pexec(`"${javaCmd}" -version`).then(result => {
                    let message = _.get(result, 'stdout');
                    if (_.isEmpty(message)) {
                        message = _.get(result, 'stderr');
                    }
                    resolve(message.indexOf('java version') >= 0);
                }).catch(e => {
                    resolve(false);
                });
            });
        }

    };
}();

module.exports = processHandler;


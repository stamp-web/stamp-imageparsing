/*
 Copyright 2018 Jason Drake (jadrake75@gmail.com)

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
import {inject} from 'aurelia-framework';
import {remote} from 'electron';
import {ImageHandler} from 'processing/image/image-handler';

@inject(ImageHandler)
export class App {

    boxes = [];
    chosenFile;
    handler;
    processing;

  constructor(imageHandler) {
    this.message = 'Hello World!';
    this.handler  = imageHandler;
      this.message = "test"; //imageResult.width;

  }

  process() {
        this.handler.readImage(this.chosenFile[0]).then((result) => {
            this.handler.process(result.data, {}).then(data => {
                this.boxes = data.boxes;
            });

        });

  }
}

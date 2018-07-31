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
import {inject, LogManager} from 'aurelia-framework';
import {remote} from 'electron';
import {ImageHandler} from 'processing/image/image-handler';
import {StringUtilities} from 'util/string-utilities';

@inject(ImageHandler)
export class App {

    boxes = [];
    scalingFactor=1.0;
    image;

    data;
    chosenFile;
    handler;
    processing;

  constructor(imageHandler) {
    this.message = 'Hello World!';
    this.handler  = imageHandler;
      this.message = "test"; //imageResult.width;
      this.logger = LogManager.getLogger('app');

  }

  fileSelected() {
      if(this.chosenFile.length > 0 ) {
          let f = this.chosenFile[0];
          this.data = undefined;
          this.boxes.splice(0, this.boxes.length);
          this.handler.readImage(f).then((result) => {
              this.data = result.data;
              this.image = this.handler.asDataUrl(this.data);
          });
      }
  }

  zoom(factor) {
      if(factor > 0 ) {
          this.scalingFactor = this.scalingFactor * 2.0;
      } else {
          this.scalingFactor = this.scalingFactor / 2.0;
      }
  }

  process(f) {
      if( this.data ) {
          this.handler.process(this.data, {}).then(info => {
              this.boxes = info.boxes;
          });
      }
  }
}

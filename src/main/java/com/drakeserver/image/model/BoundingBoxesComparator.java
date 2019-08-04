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
package com.drakeserver.image.model;

import java.util.Comparator;

 public class BoundingBoxesComparator implements Comparator<BoundingBox> {

        @Override
        public int compare(BoundingBox r1, BoundingBox r2) {
            if (r1.y + r1.height > (r2.y + r2.height + 50)) {
                return 1;
            } else if (r1.y + r1.height < r2.y) {
                return -1;
            }
            if (r1.x > r2.x) {
                return 1;
            } else if (r1.x < r2.x) {
                return -1;
            }
            return 0;
        }

    }
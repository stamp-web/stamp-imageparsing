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
package com.drakeserver.processing;

import ij.IJ;
import ij.ImagePlus;

import java.awt.Rectangle;

/**
 *
 * @author jadra
 */
public class ImageProcessor {
    
    public ImageProcessor() {
        
    }
    
    public Rectangle process() {
        ImagePlus the_image = new ImagePlus();
        Rectangle rect = new Rectangle(50,75);
        return rect;
    }
}

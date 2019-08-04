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
package com.drakeserver.image;

/**
 * Constants for Image Processing
 */
public interface ImageConstants {

    // Preference Keys
    public static final String DILATION_COUNT = "dilationCount";
    public static final String MIN_INTERCEPTING_AREA = "minimumInterceptingArea";
    public static final String MIN_BOUNDING_AREA = "minimumBoundingArea";
    public static final String BOX_PADDING = "padding";
}

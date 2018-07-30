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
package com.drakeserver;

/**
 * Constants for Image Processing
 */
public interface ImageConstants {

    public static final float AVAILABLE_MEMORY_RATIO = 2.5f;
    public static final int PADDING_DEFAULT = 20;
    public static final int MINIMUM_AREA_DEFAULT = 10000;
    public static final float MAXIMUM_AREA_PERCENTAGE = 0.85f;
    public static final float MINIMUM_OVERLAP_PERCENTAGE = 0.25f;

    // Preference Keys
    public static final String MIN_INTERCEPTING_AREA = "minimumInterceptingArea";
}

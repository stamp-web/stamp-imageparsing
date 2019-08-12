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
package com.drakeserver.stamp.imageparsing.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.drakeserver.image.model.BoundingBox;
import com.drakeserver.image.processing.ImageProcessorService;

@RestController
public class ImageProcessingController {

	@Autowired
	private ImageProcessorService imageProcessorService;

	@RequestMapping(value = "/api/svc/process-image", method = RequestMethod.POST)
	public List<BoundingBox> processImage(@RequestBody Map<String, ?> payload) throws IOException {
		List<BoundingBox> bounds = imageProcessorService.process(payload);
		return bounds;
	}
	
}

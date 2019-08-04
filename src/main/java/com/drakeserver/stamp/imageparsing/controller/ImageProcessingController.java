package com.drakeserver.stamp.imageparsing.controller;

import java.awt.Rectangle;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Properties;

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
	
	
	@RequestMapping("/test")
	public String getInfo() {
		return "test";
	}

	@RequestMapping(value = "/api/svc/process-image", method = RequestMethod.POST)
	public List<BoundingBox> processImage(@RequestBody Map<String, Object> payload) throws IOException {
		List<BoundingBox> bounds = imageProcessorService.process(new Properties(), (String) payload.get("file"));
		return bounds;
	}
}

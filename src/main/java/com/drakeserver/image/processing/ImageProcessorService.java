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
package com.drakeserver.image.processing;

import com.drakeserver.image.ImageConstants;
import com.drakeserver.image.model.BoundingBox;
import com.drakeserver.image.model.BoundingBoxesComparator;
import com.drakeserver.messaging.MessageConstants;
import com.drakeserver.messaging.MessageHelper;
import com.drakeserver.util.FileUtilities;

import ij.IJ;
import ij.ImagePlus;
import ij.measure.Measurements;
import ij.measure.ResultsTable;
import ij.plugin.filter.ParticleAnalyzer;
import lombok.NoArgsConstructor;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 */
@Service
@NoArgsConstructor
public class ImageProcessorService {

    static final Logger LOGGER = Logger.getLogger(ImageProcessorService.class.getName());

    public static final float AVAILABLE_MEMORY_RATIO = 2.5f;
    public static final int DILATION_COUNT = 0;
    public static final int PADDING_DEFAULT = 20;
    public static final int MINIMUM_AREA_DEFAULT = 10000;
    public static final float MAXIMUM_AREA_PERCENTAGE = 0.85f;
    public static final float MINIMUM_OVERLAP_PERCENTAGE = 0.25f;

    private static final String ENCODING_PREFIX = "base64,";
    private static final String FILENAME = "filename";
    private static final String FILE = "file";
    
    @Autowired
    private MessageHelper messageHelper;

    private void sendMessage(String msg) {
   		messageHelper.dispatchMessage(MessageConstants.STATUS_MESSAGE, msg);
    }
    
    private BufferedImage getImage(Map<String, ?> opts) throws IOException {
    	BufferedImage image = null;
    	if (opts.containsKey(FILENAME)) {
    		String filename = ((String) opts.get(FILENAME));
    		File f = FileUtilities.getFile(filename);
    		image = ImageIO.read(f);
    	} else if (opts.containsKey(FILE)) {
    		String data = (String) opts.get(FILE);
            int contentStartIndex = data.indexOf(ENCODING_PREFIX) + ENCODING_PREFIX.length();
            byte[] imageData = Base64.getMimeDecoder().decode(data.substring(contentStartIndex));
            image = ImageIO.read(new ByteArrayInputStream(imageData)); 
          	imageData = null;
    	}
    	return image;
    }
    
    public List<BoundingBox> process(Map<String, ?> opts) throws IOException {
		Properties options = new Properties();
		options.putAll((Map<?,?>) opts.get("options"));
		
        int image_padding = Integer.valueOf(options.getProperty(ImageConstants.BOX_PADDING, Integer.toString(PADDING_DEFAULT)));
        int minimum_size = Integer.valueOf(options.getProperty(ImageConstants.MIN_BOUNDING_AREA, Integer.toString(MINIMUM_AREA_DEFAULT)));
        float min_percentage = Float.valueOf(options.getProperty(ImageConstants.MIN_INTERCEPTING_AREA, Float.toString(MINIMUM_OVERLAP_PERCENTAGE)));
        int dilationCount = Integer.valueOf(options.getProperty(ImageConstants.DILATION_COUNT, Integer.toString(DILATION_COUNT)));

        LOGGER.log(Level.INFO, "Padding: {0}, Minimum Size: {1}, Minimum Intercepting Area: {2}, Dilation Count: {3}",
                   new Object[] {image_padding, minimum_size, min_percentage, dilationCount});
        
        BufferedImage image = getImage(opts);
        ImagePlus the_image = new ImagePlus("imported image...", image);

        ArrayList<BoundingBox> boxes = new ArrayList<>();
        try {
            prepareImage(the_image);
/*            if (Resources.getPreferencesNode().getBoolean(ImageConstants.STAMP_AGE, false)) {
                EventBus.publish(new StatusEvent(StatusType.Message, Resources.getString("message.boundingBoxes.modernConvert")));
                IJ.run(the_image, "Make Binary", "");
                logImage(the_image, "binaryModern");
            }*/

            for (int i = 0; i < dilationCount; i++) {
            	sendMessage("Dilating Image - Phase:" + (i+1));
                IJ.run(the_image, "Dilate", "");
            }
            IJ.run(the_image, "Fill Holes", "");
            IJ.run(the_image, "Set Measurements...", "area bounding redirect=None decimal=3");
            ResultsTable table = new ResultsTable();

            int maximum_area = the_image.getWidth() * the_image.getHeight();

            ParticleAnalyzer partAnalyzer = new ParticleAnalyzer(ParticleAnalyzer.EXCLUDE_EDGE_PARTICLES + ParticleAnalyzer.SHOW_NONE,
                    Measurements.AREA + Measurements.RECT, table, (1.0 * minimum_size), maximum_area, 0.0, 1.0);
            partAnalyzer.analyze(the_image, the_image.getProcessor());
            partAnalyzer = null;

            int total = table.getCounter();
            int h = image.getHeight();
            int w = image.getWidth();
            int size_min = (int) Math.sqrt(minimum_size);
            for (int row = 0; row < total; row++) {
            	BoundingBox r = createRectangle(table, h, w, row, image_padding);
                if (r.getWidth() > size_min && r.getHeight() > size_min) {
                    boxes.add(r);
                }
            }
            table.reset();
            table = null;

            //  logger.log(Level.INFO, "createBoundingBoxes() - memory after completion of bounding box creation: {0}MB", UIHelper.getUsedMemory());
            LOGGER.log(Level.INFO, "Number of rectangles found before post-processing: {0}", new Object[]{boxes.size()});
            sendMessage("Post-Processing Image...");
            postProcessBoundingBoxes(boxes, min_percentage);
            //  if (Resources.getPreferencesNode().getBoolean(ImageConstants.CONJOIN_STAMPS, false)) {
            //      rectangles = conjoinStamps(rectangles);
            //  }
        } finally {
            the_image.flush();
            the_image.close();
            image.flush();
            image = null;
            the_image = null;
        }

        return boxes;
    }

	private void prepareImage(ImagePlus the_image) {
		sendMessage("Smoothing Image...");
		IJ.run(the_image, "Smooth", "");
		sendMessage("Enhancing Image Constrast...");
		IJ.run(the_image, "Enhance Contrast", "saturated=0.4");
		IJ.run(the_image, "8-bit", "");
		//handleLightBackground(the_image);
		sendMessage("Despeckling Image...");
		IJ.run(the_image, "Despeckle", "");
		IJ.run(the_image, "Remove Outliers...", "radius=5 threshold=50 which=Bright");
		IJ.run(the_image, "Make Binary", "");
	}

    protected void postProcessBoundingBoxes(List<BoundingBox> rectangles, float min_percentage) {
        Collections.sort(rectangles, new BoundingBoxesComparator());
        Set<BoundingBox> removal = new HashSet<>();
        int size = rectangles.size();
        
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
            	BoundingBox r = rectangles.get(i);
            	BoundingBox master = rectangles.get(j);
                if (master == r) {
                    continue;
                } else if (master.contains(r)) {
                    if (LOGGER.isLoggable(Level.FINE)) {
                        LOGGER.log(Level.FINE, "postProcessBoundingBoxes() - removing enclosed child: {0}", r);
                    }
                    removal.add(r);
                } else if (master.intersects(r)) {
                	BoundingBox intercept = master.intersection(r);
                    double intercept_area = intercept.getWidth() * intercept.getHeight();
                    double master_area = master.getWidth() * master.getHeight();
                    if (intercept_area > min_percentage * master_area && (master_area > r.getWidth() * r.getHeight())) {
                        if (LOGGER.isLoggable(Level.FINE)) {
                            LOGGER.log(Level.FINE, "postProcessBoundingBoxes() - removing smaller intercepting box: {0}", r);
                        }
                        removal.add(r);
                    }
                }
            }
        }
        if (!removal.isEmpty()) {
            LOGGER.log(Level.FINE, "postProcessBoundingBoxes() - total bounding boxes: {0}", removal.size());
            rectangles.removeAll(removal);
        }
    }

    private BoundingBox createRectangle(ResultsTable table, int h, int w, int row, int image_padding) {
    	BoundingBox r = new BoundingBox();

        r.setX(Math.max(0, Double.valueOf(table.getValueAsDouble(ResultsTable.ROI_X, row)).intValue() - image_padding));
        r.setY(Math.max(0, Double.valueOf(table.getValueAsDouble(ResultsTable.ROI_Y, row)).intValue() - image_padding));
        r.setWidth(Double.valueOf(table.getValueAsDouble(ResultsTable.ROI_WIDTH, row)).intValue() + (2 * image_padding));
        r.setHeight(Double.valueOf(table.getValueAsDouble(ResultsTable.ROI_HEIGHT, row)).intValue() + (2 * image_padding));
        if (r.getWidth() + r.getX() > w) {
            r.setWidth(w - r.getX());
        }
        if (r.getHeight() + r.getY() > h) {
            r.setHeight(h - r.getY());
        }
        return r;
    }

}

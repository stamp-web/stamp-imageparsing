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

import com.drakeserver.ImageConstants;
import com.drakeserver.model.BoundingBoxesComparator;
import ij.IJ;
import ij.ImagePlus;
import ij.measure.Measurements;
import ij.measure.ResultsTable;
import ij.plugin.filter.ParticleAnalyzer;

import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Properties;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.Logger;
import javax.imageio.ImageIO;

/**
 */
public class ImageProcessor {

    static final Logger LOGGER = Logger.getLogger(ImageProcessor.class.getName());

    public ImageProcessor() {
        configureLogger();
    }

    private void configureLogger() {
        try {
            FileInputStream fis = new FileInputStream("dist/logging.properties");
            LogManager.getLogManager().readConfiguration(fis);
        } catch (IOException | SecurityException ex) {
            Logger.getLogger(ImageProcessor.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public Rectangle[] process(byte[] imgBytes, Properties options) {
        int image_padding = Integer.valueOf(options.getProperty(ImageConstants.BOX_PADDING, Integer.toString(ImageConstants.PADDING_DEFAULT)));
        int minimum_size = Integer.valueOf(options.getProperty(ImageConstants.MIN_BOUNDING_AREA, Integer.toString(ImageConstants.MINIMUM_AREA_DEFAULT)));
        float min_percentage = Float.valueOf(options.getProperty(ImageConstants.MIN_INTERCEPTING_AREA, Float.toString(ImageConstants.MINIMUM_OVERLAP_PERCENTAGE)));
        LOGGER.log(Level.INFO, "Padding: {0}, Minimum Size: {1}, Minimum Intercepting Area: {2}", new Object[] {image_padding, minimum_size, min_percentage});
        
        BufferedImage image = getBufferedImage(imgBytes);

        ImagePlus the_image = new ImagePlus("imported image...", image);
        options.setProperty("msg", "test it now");
        ArrayList<Rectangle> rectangles = new ArrayList<>();
        try {
            options.setProperty("msg", "smoothing");
            IJ.run(the_image, "Smooth", "");
            options.setProperty("msg", "enhance constrast");
            IJ.run(the_image, "Enhance Contrast", "saturated=0.4");
            IJ.run(the_image, "8-bit", "");
            //handleLightBackground(the_image);
            options.setProperty("msg", "despeckle");
            IJ.run(the_image, "Despeckle", "");
            IJ.run(the_image, "Remove Outliers...", "radius=5 threshold=50 which=Bright");
            IJ.run(the_image, "Make Binary", "");
/*            if (Resources.getPreferencesNode().getBoolean(ImageConstants.STAMP_AGE, false)) {
                EventBus.publish(new StatusEvent(StatusType.Message, Resources.getString("message.boundingBoxes.modernConvert")));
                IJ.run(the_image, "Make Binary", "");
                logImage(the_image, "binaryModern");
            }*/
            int iterations = 4; // Resources.getPreferencesNode().getInt(ImageConstants.DILATION_COUNT, 0);
            for (int i = 0; i < iterations; i++) {
                IJ.run(the_image, "Dilate", "");
            }
            IJ.run(the_image, "Fill Holes", "");
            IJ.run(the_image, "Set Measurements...", "area bounding redirect=None decimal=3");
            ResultsTable table = new ResultsTable();
            LOGGER.log(Level.INFO, "test message");
           
            int maximum_area = the_image.getWidth() * the_image.getHeight();

            ParticleAnalyzer partAnalyzer = new ParticleAnalyzer(ParticleAnalyzer.EXCLUDE_EDGE_PARTICLES + ParticleAnalyzer.SHOW_NONE,
                    Measurements.AREA + Measurements.RECT, table, (1.0 * minimum_size), maximum_area, 0.0, 1.0);
            partAnalyzer.analyze(the_image, the_image.getProcessor());
            
            int total = table.getCounter();
            int h = image.getHeight();
            int w = image.getWidth();
            int size_min = (int) Math.sqrt(minimum_size);
            for (int row = 0; row < total; row++) {
                Rectangle r = createRectangle(table, h, w, row, image_padding);
                if (r.width > size_min && r.height > size_min) {
                    rectangles.add(r);
                }
            }
            table.reset();
            System.gc();
            //  logger.log(Level.INFO, "createBoundingBoxes() - memory after completion of bounding box creation: {0}MB", UIHelper.getUsedMemory());
            LOGGER.log(Level.INFO, "Number of rectangles found before post-processing: {0}", new Object[]{rectangles.size()});
            options.setProperty("msg", "post-processing");
            postProcessBoundingBoxes(rectangles, min_percentage);
            //  if (Resources.getPreferencesNode().getBoolean(ImageConstants.CONJOIN_STAMPS, false)) {
            //      rectangles = conjoinStamps(rectangles);
            //  }
        } finally {
            the_image.flush();
            the_image.close();
        }

        Rectangle[] rects = new Rectangle[0];
        return rectangles.toArray(rects);
    }

    protected void postProcessBoundingBoxes(List<Rectangle> rectangles, float min_percentage) {
        Collections.sort(rectangles, new BoundingBoxesComparator());
        Set<Rectangle> removal = new HashSet<>();
        int size = rectangles.size();
        
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                Rectangle r = rectangles.get(i);
                Rectangle master = rectangles.get(j);
                if (master == r) {
                    continue;
                } else if (master.contains(r)) {
                    if (LOGGER.isLoggable(Level.FINE)) {
                        LOGGER.log(Level.FINE, "postProcessBoundingBoxes() - removing enclosed child: {0}", r);
                    }
                    removal.add(r);
                } else if (master.intersects(r)) {
                    Rectangle intercept = master.intersection(r);
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

    private Rectangle createRectangle(ResultsTable table, int h, int w, int row, int image_padding) {
        Rectangle r = new Rectangle();

        r.x = Math.max(0, Double.valueOf(table.getValueAsDouble(ResultsTable.ROI_X, row)).intValue() - image_padding);
        r.y = Math.max(0, Double.valueOf(table.getValueAsDouble(ResultsTable.ROI_Y, row)).intValue() - image_padding);
        r.width = Double.valueOf(table.getValueAsDouble(ResultsTable.ROI_WIDTH, row)).intValue() + (2 * image_padding);
        r.height = Double.valueOf(table.getValueAsDouble(ResultsTable.ROI_HEIGHT, row)).intValue() + (2 * image_padding);
        if (r.width + r.x > w) {
            r.width = w - r.x;
        }
        if (r.height + r.y > h) {
            r.height = h - r.y;
        }
        return r;
    }

    private BufferedImage getBufferedImage(byte[] imgBytes) {
        ByteArrayInputStream bais = new ByteArrayInputStream(imgBytes);
        try {
            return ImageIO.read(bais);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}

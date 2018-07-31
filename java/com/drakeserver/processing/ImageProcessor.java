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
import java.io.FileNotFoundException;
import java.io.IOException;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.Logger;
import java.util.prefs.Preferences;
import javax.imageio.ImageIO;

/**
 *
 * @author jadra
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
        //  System.out.println(options);

        BufferedImage image = getBufferedImage(imgBytes);

        ImagePlus the_image = new ImagePlus("imported image...", image);
        options.setProperty("msg", "test it now");
        ArrayList<Rectangle> rectangles = new ArrayList<Rectangle>();
        try {
options.setProperty("msg", "smoothing");
            IJ.run(the_image, "Smooth", ""); //$NON-NLS-1$
            options.setProperty("msg", "enhance constrast");
            IJ.run(the_image, "Enhance Contrast", "saturated=0.4"); //$NON-NLS-1$
            IJ.run(the_image, "8-bit", ""); //$NON-NLS-1$
            //handleLightBackground(the_image);
            options.setProperty("msg", "despeckle");
            IJ.run(the_image, "Despeckle", ""); //$NON-NLS-1$
            IJ.run(the_image, "Remove Outliers...", "radius=5 threshold=50 which=Bright"); //$NON-NLS-1$
            IJ.run(the_image, "Make Binary", ""); //$NON-NLS-1$
/*            if (Resources.getPreferencesNode().getBoolean(ImageConstants.STAMP_AGE, false)) {
                EventBus.publish(new StatusEvent(StatusType.Message, Resources.getString("message.boundingBoxes.modernConvert")));
                IJ.run(the_image, "Make Binary", ""); //$NON-NLS-1$
                logImage(the_image, "binaryModern");
            }*/
            int iterations = 4; // Resources.getPreferencesNode().getInt(ImageConstants.DILATION_COUNT, 0);
            for (int i = 0; i < iterations; i++) {
                IJ.run(the_image, "Dilate", "");
            }
            IJ.run(the_image, "Fill Holes", ""); //$NON-NLS-1$
            IJ.run(the_image, "Set Measurements...", "area bounding redirect=None decimal=3"); //$NON-NLS-1$
            ResultsTable table = new ResultsTable();
            LOGGER.log(Level.INFO, "test message");
            int minimum_size = 10000;
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
                Rectangle r = createRectangle(table, h, w, row);
                if (r.width > size_min && r.height > size_min) {
                    rectangles.add(r);
                }
            }
            table.reset();
            System.gc();
            //  logger.log(Level.INFO, "createBoundingBoxes() - memory after completion of bounding box creation: {0}MB", UIHelper.getUsedMemory()); //$NON-NLS-1$
            LOGGER.log(Level.INFO, "Number of rectangles found before post-processing: {0}", new Object[]{rectangles.size()});
            postProcessBoundingBoxes(rectangles, options);
            //  if (Resources.getPreferencesNode().getBoolean(ImageConstants.CONJOIN_STAMPS, false)) {
            //      rectangles = conjoinStamps(rectangles);
            //  }
        } finally {
            the_image.flush();
            the_image.close();
            imgBytes = null;
        }

        Rectangle[] rects = new Rectangle[0];
        return rectangles.toArray(rects);
    }

    protected void postProcessBoundingBoxes(List<Rectangle> rectangles, Properties options) {
        // EventBus.publish(new StatusEvent(StatusType.Message, Resources.getString("message.boundingBoxes.sort"))); //$NON-NLS-1$
        Collections.sort(rectangles, new BoundingBoxesComparator());
        // EventBus.publish(new StatusEvent(StatusType.Message, Resources.getString("message.postProcessing"))); //$NON-NLS-1$
        Set<Rectangle> removal = new HashSet<>();
        int size = rectangles.size();
        // Preferences prefs = Resources.getPreferencesNode();
        // float min_percentage = prefs.getFloat(ImageConstants.BOUNDING_BOX_MIN_OVERLAP_AREA, ImageConstants.MINIMUM_OVERLAP_PERCENTAGE);

        float min_percentage = options.containsKey(ImageConstants.MIN_INTERCEPTING_AREA)
                ? Float.valueOf(options.getProperty(ImageConstants.MIN_INTERCEPTING_AREA))
                : 0.25f;
        LOGGER.log(Level.INFO, "min-percentage: " + min_percentage);
        
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

    private Rectangle createRectangle(ResultsTable table, int h, int w, int row) {
        Rectangle r = new Rectangle();

        int image_padding = 20;

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

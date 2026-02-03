package com.drakeserver.image.processing;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.util.ArrayList;
import java.util.List;

import com.drakeserver.image.model.BoundingBox;

import ij.measure.ResultsTable;

public class ImageProcessorServiceTest {

	ImageProcessorService service;
	
	@BeforeEach
	public void setup() {
		service = new ImageProcessorService();
	}
	
	@Test
	public void createBoundingBox_AtRightBottomEdge() {
		ResultsTable rt = new ResultsTable(1);
		rt.addValue(ResultsTable.ROI_X, 50.0);
		rt.addValue(ResultsTable.ROI_Y, 50.0);
		rt.addValue(ResultsTable.ROI_WIDTH, 250.0);
		rt.addValue(ResultsTable.ROI_HEIGHT, 250.0);
		
		BoundingBox box = service.createBoundingBox(rt, 250, 250, 0, 0);
		assertEquals(200, box.getWidth());
		assertEquals(200, box.getHeight());
		assertEquals(50, box.getX());
		assertEquals(50, box.getY());
	}
	
	@Test
	public void createBoundingBox_WithinBounds() {
		ResultsTable rt = new ResultsTable(1);
		rt.addValue(ResultsTable.ROI_X, 0.0);
		rt.addValue(ResultsTable.ROI_Y, 0.0);
		rt.addValue(ResultsTable.ROI_WIDTH, 50.0);
		rt.addValue(ResultsTable.ROI_HEIGHT, 50.0);
		
		BoundingBox box = service.createBoundingBox(rt, 250, 250, 0, 0);
		assertEquals(50, box.getWidth());
		assertEquals(50, box.getHeight());
		assertEquals(0, box.getX());
		assertEquals(0, box.getY());
	}
	
	@Test
	public void createBoundingBox_BeforeBounds() {
		ResultsTable rt = new ResultsTable(1);
		rt.addValue(ResultsTable.ROI_X, 50.0);
		rt.addValue(ResultsTable.ROI_Y, 50.0);
		rt.addValue(ResultsTable.ROI_WIDTH, 80.0);
		rt.addValue(ResultsTable.ROI_HEIGHT, 80.0);
		
		BoundingBox box = service.createBoundingBox(rt, 250, 250, 0, 0);
		assertEquals(80, box.getWidth());
		assertEquals(80, box.getHeight());
		assertEquals(50, box.getX());
		assertEquals(50, box.getY());
	}

	@Test
	public void createBoundingBox_WithPadding() {
		ResultsTable rt = new ResultsTable(1);
		rt.addValue(ResultsTable.ROI_X, 20.0);
		rt.addValue(ResultsTable.ROI_Y, 20.0);
		rt.addValue(ResultsTable.ROI_WIDTH, 50.0);
		rt.addValue(ResultsTable.ROI_HEIGHT, 50.0);
		
		BoundingBox box = service.createBoundingBox(rt, 250, 250, 0, 10);
		assertEquals(70, box.getWidth());
		assertEquals(70, box.getHeight());
		assertEquals(10, box.getX());
		assertEquals(10, box.getY());
	}
	
	@Test
	public void postProcessBoundingBoxes_InnerRemoved() {
		BoundingBox box = new BoundingBox(0, 0, 100, 100);
		BoundingBox boxWithin = new BoundingBox(10, 10, 10, 10);
		List<BoundingBox> boxes = new ArrayList<BoundingBox>();
		boxes.add(box);
		boxes.add(boxWithin);
		service.postProcessBoundingBoxes(boxes, 0.1f);
		assertTrue( !boxes.contains(boxWithin));
	}
	
	@Test
	public void postProcessBoundingBoxes_Intersected() {
		BoundingBox box = new BoundingBox(0, 0, 100, 100);
		BoundingBox intersection = new BoundingBox(50, 50, 90, 90);
		List<BoundingBox> boxes = new ArrayList<BoundingBox>();
		boxes.add(box);
		boxes.add(intersection);
		service.postProcessBoundingBoxes(boxes, 0.15f);
		assertTrue(!boxes.contains(intersection));
	}

}

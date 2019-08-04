package com.drakeserver.stamp.imageparsing;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication(scanBasePackages= {"com.drakeserver.image", "com.drakeserver.stamp.imageparsing.controller"})
public class StampImageParsingApplication {

	static { /* too late ! */
	      
	      /* ---> prints false */
	    }
	
	public static void main(String[] args) {
		
		System.setProperty("java.awt.headless", "false");
		//Toolkit tk = Toolkit.getDefaultToolkit();
	      System.out.println(java.awt.GraphicsEnvironment.isHeadless());
	      SpringApplicationBuilder builder = new SpringApplicationBuilder(StampImageParsingApplication.class);
	      builder
	      	.headless(false)
	      	.run(args);
	      
	}
	
	

}

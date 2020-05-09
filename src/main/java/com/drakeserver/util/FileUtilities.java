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
package com.drakeserver.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Component;
import org.springframework.util.ResourceUtils;

import com.drakeserver.image.processing.ImageProcessorService;

/**
 * Solution loosely based on 
 * https://gist.github.com/digulla/31eed31c7ead29ffc7a30aaf87131def
 *
 */
@PropertySource(ignoreResourceNotFound = true, value = "classpath:applicaion.properties")
@Component
public class FileUtilities {
	
	private static final Logger logger = Logger.getLogger(ImageProcessorService.class.getName());
	
	private static final String REMOTE_NAME = "Remote name";
	private static final String DRIVE_LETTER_REGEX = "^[A-Za-z]:(.*)";

	private static final boolean IS_WINDOWS = isWindows();

	public static boolean isWindows() {
		String os = System.getProperty("os.name").toLowerCase();
		return os.startsWith("windows");
	}

	public static File getFile(final String path) throws FileNotFoundException {
		String filename = path;
		
		if (IS_WINDOWS && filename.matches(DRIVE_LETTER_REGEX)) {
			String letter = filename.substring(0,2);
			String networkMapping = FileUtilities.getNetworkMapping(letter);
			if (networkMapping != null) {
				logger.log(Level.FINE, "Replacing \"{0}\" with Network Path \"{1}\"", new Object[] {letter, networkMapping});
				filename = filename.replace(letter, networkMapping);
			}
		}
		return ResourceUtils.getFile(filename);
	}

	/**
	 * Use the command <code>net</code> to determine what this drive is.
	 * <code>net use</code> will return an error for anything which isn't a share.
	 * 
	 */
	public static String getNetworkMapping(String driveLetter) {
		List<String> cmd = Arrays.asList("cmd", "/c", "net", "use", driveLetter);

		String networkMapping = null;
		try {
			Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
			p.getOutputStream().close();

			String line;
			try (BufferedReader in = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
				while ((line = in.readLine().trim()) != null) {
					if(line.startsWith(REMOTE_NAME)) {
						networkMapping = line.substring(REMOTE_NAME.length()).trim();
						break;
					}
				}
			}

			if(p.waitFor() != 0) {
				return null;
			}
			return networkMapping;
		} catch (Exception e) {
			logger.log(Level.WARNING, "Unable to run 'net use' on " + driveLetter);
			logger.log(Level.FINER, e.getMessage(), e);
			return null;
		}
	}
}

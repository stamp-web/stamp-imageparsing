/*
Copyright 2020 Jason Drake (jadrake75@gmail.com)

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

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class FileUtilitiesTest {

	/**
	 * The root drive should never result in the network mapping being
	 * resolved for C: drive
	 */
	@Test
	public void getNetworkMapping_C_DriveHandled() {
		if (FileUtilities.isWindows()) {
			String value = FileUtilities.getNetworkMapping("c:");
			assertNull(value, "Lowecase c value" );
			value = FileUtilities.getNetworkMapping("C:");
			assertNull(value, "Capital C failed");	
		}
	}

}

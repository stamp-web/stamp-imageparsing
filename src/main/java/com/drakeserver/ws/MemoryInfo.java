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
package com.drakeserver.ws;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import com.drakeserver.messaging.MessageConstants;
import com.drakeserver.ws.model.MemoryInfoModel;

@Controller
public class MemoryInfo {
	 
	@MessageMapping("/memory-info") 
	@SendTo(MessageConstants.MEMORY_STATS)
	public MemoryInfoModel getMemoryInformation() {
		MemoryInfoModel model = new MemoryInfoModel();
		Runtime rt = Runtime.getRuntime();
		model.setFreeMemory(rt.freeMemory());
		model.setMaxMemory(rt.maxMemory());
		model.setTotalMemory(rt.totalMemory());
		return model;
	}
}

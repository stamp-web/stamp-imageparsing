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
package com.drakeserver.net;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import lombok.NoArgsConstructor;

@Component
@NoArgsConstructor
public class ServerSettings implements ApplicationRunner {
	
	@Value("${apiKey}")
	String val;
	
	public String getApplicationKey() {
		return val;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		if (args.containsOption(HttpConstants.APPLICATION_KEY)) {
			List<String> values = args.getOptionValues(HttpConstants.APPLICATION_KEY);
			if (!values.isEmpty()) {
				this.val = values.iterator().next();
				if(this.val.startsWith("\"") && this.val.endsWith("\"")) {
					this.val = this.val.substring(1,this.val.length() - 1);
				}
			}	
		}
	}
}

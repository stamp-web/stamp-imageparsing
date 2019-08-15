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
package com.drakeserver.ws.config;

import java.util.Map;
import java.util.logging.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.drakeserver.net.HttpConstants;
import com.drakeserver.net.ServerSettings;

@Component
public class WebSocketAuthorizer implements HandshakeInterceptor {

	private static final Logger logger = Logger.getLogger(WebSocketAuthorizer.class.getName());
	
	@Autowired
	ServerSettings settings;
	
	@Override
	public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
			Map<String, Object> attributes) throws Exception {
		ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
		String apiKey = servletRequest.getServletRequest().getParameter(HttpConstants.APPLICATION_KEY);
		boolean matches = this.isApiKeyMatch(apiKey);
		if (!matches) {
			logger.warning("ApiKey did not match configured key. Preventing Handshake.");
		}
		return matches;
	}

	@Override
	public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
			Exception exception) { }
	
	boolean isApiKeyMatch(String apiKey) {
		return (apiKey != null && apiKey.equals(settings.getApplicationKey()));
	}

}

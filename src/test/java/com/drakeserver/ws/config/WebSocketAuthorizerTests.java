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

import static org.junit.Assert.*;

import javax.servlet.http.HttpServletRequest;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.test.context.junit4.SpringRunner;

import com.drakeserver.net.HttpConstants;
import com.drakeserver.net.ServerSettings;

@RunWith(SpringRunner.class)
public class WebSocketAuthorizerTests {

	@MockBean
	private ServerSettings settings;
	
	@Mock
	HttpServletRequest servletRequest;
	
	WebSocketAuthorizer authorizer;
	
	@Before
	public void setup() {
		authorizer = new WebSocketAuthorizer();
	}
	
	@Test 
	public void beforeHandshake_Matches() throws Exception {
		ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
		Mockito.when(servletRequest.getParameter(HttpConstants.APPLICATION_KEY)).thenReturn("b17e0a7a-010e-4c70-a02c-824cf71b0868");
		Mockito.when(settings.getApplicationKey()).thenReturn("b17e0a7a-010e-4c70-a02c-824cf71b0868");
		
		authorizer.settings = settings;
		assertTrue("unAuthorized matching apiKeys", authorizer.beforeHandshake(request, null, null, null));
	}
	
	@Test 
	public void beforeHandshake_NoMatch() throws Exception {
		ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
		Mockito.when(servletRequest.getParameter(HttpConstants.APPLICATION_KEY)).thenReturn("XYZ");
		Mockito.when(settings.getApplicationKey()).thenReturn("ABC");
		
		authorizer.settings = settings;
		assertFalse("Authorized non-matching apiKeys", authorizer.beforeHandshake(request, null, null, null));
	}
	
	@Test 
	public void afterHandshake_NoOp() throws Exception {
		ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
		try {
			authorizer.afterHandshake(request, null, null, null);
		} catch (Exception e) {
			Assert.fail("Exception was incorrectly thrown"); 
		}
	}
		
	
	@Test
	public void isApiKeyMatch_IsMatch() {
		Mockito.when(settings.getApplicationKey()).thenReturn("ABC");
		authorizer.settings = settings;
		boolean matches = authorizer.isApiKeyMatch("ABC");
		assertTrue("Authorization did not match", matches);
	}
	
	@Test
	public void isApiKeyMatch_NoMatch() {
		Mockito.when(settings.getApplicationKey()).thenReturn("XYZ");
		authorizer.settings = settings;
		boolean matches = authorizer.isApiKeyMatch("ABC");
		assertFalse("Authorization did match incorrectly", matches);
	}
	
	@Test
	public void isApiKeyMatch_NullKey() {
		boolean matches = authorizer.isApiKeyMatch(null);
		assertFalse("Authorization did match incorrectly", matches);
	}
}

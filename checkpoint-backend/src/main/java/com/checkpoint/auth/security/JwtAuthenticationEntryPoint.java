package com.checkpoint.auth.security;

import com.checkpoint.common.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Any request that fails authentication (missing/invalid/expired token)
 * lands here. Returns 401 with the standard error shape instead of
 * Spring Security's default blank response.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                          AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");

        ErrorResponse body = ErrorResponse.of(
                401, "UNAUTHORIZED", "Authentication is required to access this resource.", request.getRequestURI());

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}

package com.checkpoint.auth.security;

import com.checkpoint.common.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Authenticated, but wrong role (e.g. a student hitting an admin
 * endpoint). Returns 403 per docs/06-Authentication-and-Security.md
 * section 7.
 */
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                        AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");

        ErrorResponse body = ErrorResponse.of(
                403, "FORBIDDEN", "You do not have permission to access this resource.", request.getRequestURI());

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}

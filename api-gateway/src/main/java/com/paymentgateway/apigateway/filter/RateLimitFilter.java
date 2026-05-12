package com.paymentgateway.apigateway.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedisTemplate<String, String> redisTemplate;

    private static final int MAX_REQUESTS_PER_MINUTE = 100;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        var auth = SecurityContextHolder.getContext().getAuthentication();

        // Only rate limit authenticated requests
        if (auth != null && auth.isAuthenticated()) {
            String merchantId = auth.getPrincipal().toString();
            String redisKey = "rate:limit:" + merchantId;

            // Increment request count in Redis
            Long count = redisTemplate.opsForValue().increment(redisKey);

            // Set 60 second expiry on first request
            if (count != null && count == 1) {
                redisTemplate.expire(redisKey, 60, TimeUnit.SECONDS);
            }

            // Block if over limit
            if (count != null && count > MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(429); // Too Many Requests
                response.getWriter().write("{\"error\": \"Rate limit exceeded. Max 100 requests per minute.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}

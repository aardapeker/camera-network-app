package com.aardapeker.app.config;

import com.aardapeker.app.security.AdminPanelAccessInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AdminPanelAccessInterceptor adminPanelAccessInterceptor;

    public WebConfig(AdminPanelAccessInterceptor adminPanelAccessInterceptor) {
        this.adminPanelAccessInterceptor = adminPanelAccessInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminPanelAccessInterceptor)
                .addPathPatterns("/api/admin/**");
    }
}

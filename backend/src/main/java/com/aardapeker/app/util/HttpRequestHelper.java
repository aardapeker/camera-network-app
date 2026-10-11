package com.aardapeker.app.util;

import jakarta.servlet.http.HttpServletRequest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Utility class for extracting information from HTTP requests
 */
@Component
public class HttpRequestHelper {

    /**
     * Get the client's IP address from the request
     * Handles various proxy headers
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "UNKNOWN";
        }

        // Check for IP in various proxy headers (in order of preference)
        String[] headerNames = {
            "X-Forwarded-For",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR",
        };

        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (
                ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)
            ) {
                // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
                // Take the first one (original client)
                if (ip.contains(",")) {
                    return ip.split(",")[0].trim();
                }
                return ip.trim();
            }
        }

        // Fallback to remote address
        return request.getRemoteAddr() != null
            ? request.getRemoteAddr()
            : "UNKNOWN";
    }

    /**
     * Get User-Agent header from request
     */
    public static String getUserAgent(HttpServletRequest request) {
        if (request == null) {
            return "UNKNOWN";
        }
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null && !userAgent.isEmpty()
            ? userAgent
            : "UNKNOWN";
    }

    /**
     * Parse device type from User-Agent string
     * Returns: Mobile, Tablet, Desktop, or UNKNOWN
     */
    public static String getDeviceType(String userAgent) {
        if (
            userAgent == null ||
            userAgent.isEmpty() ||
            "UNKNOWN".equals(userAgent)
        ) {
            return "UNKNOWN";
        }

        String ua = userAgent.toLowerCase();

        // Check for mobile devices
        if (
            ua.contains("mobile") ||
            ua.contains("android") ||
            ua.contains("iphone") ||
            ua.contains("ipod") ||
            ua.contains("blackberry") ||
            ua.contains("windows phone")
        ) {
            return "Mobile";
        }

        // Check for tablets
        if (
            ua.contains("tablet") ||
            ua.contains("ipad") ||
            ua.contains("kindle") ||
            ua.contains("playbook") ||
            ua.contains("silk")
        ) {
            return "Tablet";
        }

        // Default to desktop
        return "Desktop";
    }

    /**
     * Parse browser name from User-Agent string
     * Returns: Chrome, Firefox, Safari, Edge, Opera, IE, or Other
     */
    public static String getBrowser(String userAgent) {
        if (
            userAgent == null ||
            userAgent.isEmpty() ||
            "UNKNOWN".equals(userAgent)
        ) {
            return "UNKNOWN";
        }

        String ua = userAgent.toLowerCase();

        // Check in order (most specific first)
        if (ua.contains("edg/") || ua.contains("edge/")) {
            return "Edge";
        }
        if (ua.contains("opr/") || ua.contains("opera/")) {
            return "Opera";
        }
        if (ua.contains("chrome/") && !ua.contains("edg")) {
            return "Chrome";
        }
        if (ua.contains("safari/") && !ua.contains("chrome")) {
            return "Safari";
        }
        if (ua.contains("firefox/")) {
            return "Firefox";
        }
        if (ua.contains("msie") || ua.contains("trident/")) {
            return "Internet Explorer";
        }

        return "Other";
    }

    /**
     * Parse operating system from User-Agent string
     * Returns: Windows, macOS, Linux, iOS, Android, or Other
     */
    public static String getOperatingSystem(String userAgent) {
        if (
            userAgent == null ||
            userAgent.isEmpty() ||
            "UNKNOWN".equals(userAgent)
        ) {
            return "UNKNOWN";
        }

        String ua = userAgent.toLowerCase();

        if (ua.contains("windows")) {
            return "Windows";
        }
        if (ua.contains("mac os") || ua.contains("macos")) {
            return "macOS";
        }
        if (
            ua.contains("iphone") || ua.contains("ipad") || ua.contains("ipod")
        ) {
            return "iOS";
        }
        if (ua.contains("android")) {
            return "Android";
        }
        if (ua.contains("linux")) {
            return "Linux";
        }

        return "Other";
    }

    /**
     * Extract device model from User-Agent string
     * Returns device model or "Unknown Model"
     */
    public static String getDeviceModel(String userAgent) {
        if (
            userAgent == null ||
            userAgent.isEmpty() ||
            "UNKNOWN".equals(userAgent)
        ) {
            return "Unknown Model";
        }

        // Try to extract iOS device
        String iosDevice = extractIOSDevice(userAgent);
        if (iosDevice != null) {
            return iosDevice;
        }

        // Try to extract Android device
        String androidDevice = extractAndroidDevice(userAgent);
        if (androidDevice != null) {
            return androidDevice;
        }

        // For desktop/laptop, just return the OS
        return getOperatingSystem(userAgent);
    }

    /**
     * Extract iOS device information
     */
    private static String extractIOSDevice(String userAgent) {
        if (
            !userAgent.toLowerCase().contains("iphone") &&
            !userAgent.toLowerCase().contains("ipad") &&
            !userAgent.toLowerCase().contains("ipod")
        ) {
            return null;
        }

        if (userAgent.contains("iPad")) {
            return "iPad";
        } else if (userAgent.contains("iPhone")) {
            return "iPhone";
        } else if (userAgent.contains("iPod")) {
            return "iPod Touch";
        }

        return "iOS Device";
    }

    /**
     * Extract Android device manufacturer and model
     */
    private static String extractAndroidDevice(String userAgent) {
        if (!userAgent.toLowerCase().contains("android")) {
            return null;
        }

        // Try to find manufacturer and model in parentheses
        Pattern devicePattern = Pattern.compile("\\(([^)]*Android[^)]*)\\)");
        Matcher deviceMatcher = devicePattern.matcher(userAgent);

        if (deviceMatcher.find()) {
            String deviceInfo = deviceMatcher.group(1);

            // Common Android manufacturers
            String[] manufacturers = {
                "Samsung",
                "Huawei",
                "Xiaomi",
                "Oppo",
                "Vivo",
                "OnePlus",
                "Motorola",
                "LG",
                "Sony",
                "Google",
                "Pixel",
                "Galaxy",
                "Nokia",
            };

            for (String manufacturer : manufacturers) {
                if (deviceInfo.contains(manufacturer)) {
                    // Try to extract model
                    // "Linux; Android 11; Samsung Galaxy S21; Build/..."
                    // "Samsung[\\s-]?([\\w\\s\\-]+?)(?:;|\\)|Build)"
                    Pattern modelPattern = Pattern.compile(
                        manufacturer + "[\\s-]?([\\w\\s\\-]+?)(?:;|\\)|Build)"
                    );
                    // This pattern looks for:
                    // "Samsung" + optional space/hyphen + MODEL NAME + ending marker

                    Matcher modelMatcher = modelPattern.matcher(deviceInfo);

                    if (modelMatcher.find()) {
                        // group(1) captures what's in the parentheses: ([\\w\\s\\-]+?)
                        // Example: if matched "Samsung Galaxy S21;", group(1) = "Galaxy S21"
                        return (
                            manufacturer + " " + modelMatcher.group(1).trim()
                        );
                    }
                    return manufacturer;
                }
            }

            // If no manufacturer found, try to extract model code
            Pattern modelCodePattern = Pattern.compile("Build/([A-Z0-9\\-]+)");
            Matcher modelCodeMatcher = modelCodePattern.matcher(userAgent);
            if (modelCodeMatcher.find()) {
                return "Android Device (" + modelCodeMatcher.group(1) + ")";
            }
        }

        return "Android Device";
    }

    /**
     * Get a formatted string with device information
     */
    public static String getDeviceInfo(HttpServletRequest request) {
        String userAgent = getUserAgent(request);
        String device = getDeviceType(userAgent);
        String browser = getBrowser(userAgent);
        String os = getOperatingSystem(userAgent);

        return String.format("%s - %s on %s", device, browser, os);
    }

    /**
     * Get detailed device information as a structured object
     */
    public static DeviceInfo getDetailedDeviceInfo(HttpServletRequest request) {
        String userAgent = getUserAgent(request);
        return new DeviceInfo(
            getDeviceType(userAgent),
            getDeviceModel(userAgent),
            getBrowser(userAgent),
            getOperatingSystem(userAgent),
            userAgent
        );
    }

    /**
     * Inner class to hold device information
     */
    public static class DeviceInfo {

        private final String deviceType;
        private final String deviceModel;
        private final String browser;
        private final String operatingSystem;
        private final String userAgent;

        public DeviceInfo(
            String deviceType,
            String deviceModel,
            String browser,
            String operatingSystem,
            String userAgent
        ) {
            this.deviceType = deviceType;
            this.deviceModel = deviceModel;
            this.browser = browser;
            this.operatingSystem = operatingSystem;
            this.userAgent = userAgent;
        }

        public String getDeviceType() {
            return deviceType;
        }

        public String getDeviceModel() {
            return deviceModel;
        }

        public String getBrowser() {
            return browser;
        }

        public String getOperatingSystem() {
            return operatingSystem;
        }

        public String getUserAgent() {
            return userAgent;
        }

        public String getFormattedString() {
            return String.format(
                "%s - %s on %s",
                deviceModel,
                browser,
                operatingSystem
            );
        }
    }
}

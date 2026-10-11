package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.response.GeolocationResponse;
import com.aardapeker.app.service.GeolocationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GeolocationServiceImpl implements GeolocationService {

    private static final Logger logger = LoggerFactory.getLogger(
        GeolocationServiceImpl.class
    );
    private static final String IP_API_URL = "http://ip-api.com/json/";

    private final RestTemplate restTemplate;

    public GeolocationServiceImpl() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public GeolocationResponse getLocation(String ipAddress) {
        if (isLocalOrPrivateIp(ipAddress)) {
            logger.debug(
                "Skipping geolocation for local/private IP: {}",
                ipAddress
            );
            return createDefaultResponse("Local Network");
        }

        try {
            String url = IP_API_URL + ipAddress;
            logger.debug("Fetching geolocation for IP: {}", ipAddress);

            GeolocationResponse response = restTemplate.getForObject(
                url,
                GeolocationResponse.class
            );

            if (response != null && "success".equals(response.getStatus())) {
                logger.debug(
                    "Geolocation found: {}",
                    response.getFormattedLocation()
                );
                return response;
            } else {
                logger.warn("Geolocation lookup failed for IP: {}", ipAddress);
                return createDefaultResponse("Unknown");
            }
        } catch (Exception e) {
            logger.error(
                "Error fetching geolocation for IP {}: {}",
                ipAddress,
                e.getMessage()
            );
            return createDefaultResponse("Unknown");
        }
    }

    @Override
    public String getFormattedLocation(String ipAddress) {
        GeolocationResponse response = getLocation(ipAddress);
        return response != null ? response.getFormattedLocation() : "Unknown";
    }

    @Override
    public String getDetailedLocation(String ipAddress) {
        GeolocationResponse response = getLocation(ipAddress);
        return response != null ? response.getDetailedLocation() : "Unknown";
    }

    private boolean isLocalOrPrivateIp(String ip) {
        if (ip == null || ip.isEmpty() || "UNKNOWN".equals(ip)) {
            return true;
        }

        return (
            ip.startsWith("127.") ||
            ip.startsWith("10.") ||
            ip.startsWith("172.16.") ||
            ip.startsWith("172.17.") ||
            ip.startsWith("172.18.") ||
            ip.startsWith("172.19.") ||
            ip.startsWith("172.20.") ||
            ip.startsWith("172.21.") ||
            ip.startsWith("172.22.") ||
            ip.startsWith("172.23.") ||
            ip.startsWith("172.24.") ||
            ip.startsWith("172.25.") ||
            ip.startsWith("172.26.") ||
            ip.startsWith("172.27.") ||
            ip.startsWith("172.28.") ||
            ip.startsWith("172.29.") ||
            ip.startsWith("172.30.") ||
            ip.startsWith("172.31.") ||
            ip.startsWith("192.168.") ||
            ip.equals("::1") ||
            ip.startsWith("fe80:") ||
            ip.equals("0:0:0:0:0:0:0:1")
        );
    }

    private GeolocationResponse createDefaultResponse(String location) {
        GeolocationResponse response = new GeolocationResponse();
        response.setStatus("success");
        response.setCity(location);
        response.setCountry(location);
        return response;
    }
}

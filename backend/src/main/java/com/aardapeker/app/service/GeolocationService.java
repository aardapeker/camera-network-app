package com.aardapeker.app.service;

import com.aardapeker.app.dto.response.GeolocationResponse;

public interface GeolocationService {

    GeolocationResponse getLocation(String ipAddress);

    String getFormattedLocation(String ipAddress);

    String getDetailedLocation(String ipAddress);
}

package com.aardapeker.app.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO for IP geolocation response from ip-api.com
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeolocationResponse {

    private String status; // "success" or "fail"
    private String message; // Error message if status is "fail"
    private String country; // Country name
    private String countryCode; // Country code (US, UK, etc.)
    private String region; // Region/State code
    private String regionName; // Region/State name
    private String city; // City name
    private String zip; // Zip/Postal code
    private Double lat; // Latitude
    private Double lon; // Longitude
    private String timezone; // Timezone
    private String isp; // ISP name
    private String org; // Organization
    private String as; // AS number and name
    private String query; // IP address

    // No-args constructor
    public GeolocationResponse() {}

    // Helper method to format location as "City, Country"
    public String getFormattedLocation() {
        if (city != null && country != null) {
            return city + ", " + country;
        } else if (city != null) {
            return city;
        } else if (country != null) {
            return country;
        }
        return "Unknown";
    }

    // Helper method to format detailed location
    public String getDetailedLocation() {
        StringBuilder sb = new StringBuilder();
        if (city != null) sb.append(city);
        if (regionName != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(regionName);
        }
        if (country != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(country);
        }
        return sb.length() > 0 ? sb.toString() : "Unknown";
    }

    // Getters and Setters
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getRegionName() {
        return regionName;
    }

    public void setRegionName(String regionName) {
        this.regionName = regionName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getZip() {
        return zip;
    }

    public void setZip(String zip) {
        this.zip = zip;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLon() {
        return lon;
    }

    public void setLon(Double lon) {
        this.lon = lon;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getIsp() {
        return isp;
    }

    public void setIsp(String isp) {
        this.isp = isp;
    }

    public String getOrg() {
        return org;
    }

    public void setOrg(String org) {
        this.org = org;
    }

    public String getAs() {
        return as;
    }

    public void setAs(String as) {
        this.as = as;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }
}

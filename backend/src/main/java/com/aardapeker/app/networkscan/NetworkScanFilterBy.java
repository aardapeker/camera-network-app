package com.aardapeker.app.networkscan;

public enum NetworkScanFilterBy {
  ALL,
  IP,
  HOSTNAME,
  VENDOR;

  public static NetworkScanFilterBy from(String value) {
    if (value == null)
      return null;
    return NetworkScanFilterBy.valueOf(value.trim().toUpperCase());
  }
}

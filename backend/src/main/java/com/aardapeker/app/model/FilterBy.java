
package com.aardapeker.app.model;

public enum FilterBy {
  EMAIL,
  USERNAME,
  FIRSTNAME,
  LASTNAME,
  ALL;

  public static FilterBy from(String value) {
    if (value == null)
      return null;
    return FilterBy.valueOf(value.trim().toUpperCase());
  }
}

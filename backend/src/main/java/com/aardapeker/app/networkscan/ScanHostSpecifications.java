package com.aardapeker.app.networkscan;

import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class ScanHostSpecifications {

  private ScanHostSpecifications() {
  }

  public static Specification<ScanHost> hasSources(List<String> sources) {
    return (root, query, cb) -> root.get("sourceId").in(sources);
  }

  public static Specification<ScanHost> textFilter(NetworkScanFilterBy filterBy, String input) {
    String like = "%" + input.toLowerCase() + "%";

    return (root, query, cb) -> switch (filterBy) {
      case IP ->
        cb.like(cb.lower(root.get("ipAddress")), like);

      case HOSTNAME ->
        cb.like(cb.lower(root.get("hostname")), like);

      case VENDOR ->
        cb.like(cb.lower(root.get("vendor")), like);

      case ALL ->
        cb.or(
            cb.like(cb.lower(root.get("ipAddress")), like),
            cb.like(cb.lower(root.get("hostname")), like),
            cb.like(cb.lower(root.get("vendor")), like));
    };
  }
}

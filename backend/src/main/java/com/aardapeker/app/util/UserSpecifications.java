package com.aardapeker.app.util;

import com.aardapeker.app.model.*;
import jakarta.persistence.criteria.*;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class UserSpecifications {

  private UserSpecifications() {
  }

  public static Specification<User> hasStatuses(List<String> statuses) {
    return (root, query, cb) -> root.get("status").in(
        statuses.stream()
            .map(s -> Status.valueOf(s.toUpperCase()))
            .toList());
  }

  public static Specification<User> hasRoles(List<String> roles) {
    return (root, query, cb) -> {
      query.distinct(true);
      Join<User, Role> roleJoin = root.join("authorities");
      return roleJoin.in(
          roles.stream()
              .map(r -> Role.valueOf(r.toUpperCase()))
              .toList());
    };
  }

  public static Specification<User> textFilter(FilterBy filterBy, String input) {
    String like = "%" + input.toLowerCase() + "%";

    return (root, query, cb) -> switch (filterBy) {
      case EMAIL ->
        cb.like(cb.lower(root.get("email")), like);

      case USERNAME ->
        cb.like(cb.lower(root.get("username")), like);

      case FIRSTNAME ->
        cb.like(cb.lower(root.get("firstName")), like);

      case LASTNAME ->
        cb.like(cb.lower(root.get("lastName")), like);

      case ALL ->
        cb.or(
            cb.like(cb.lower(root.get("email")), like),
            cb.like(cb.lower(root.get("username")), like),
            cb.like(cb.lower(root.get("firstName")), like),
            cb.like(cb.lower(root.get("lastName")), like));
    };
  }
}

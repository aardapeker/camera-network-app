package com.aardapeker.app.dto.response;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public record DeleteUsersResult(
    List<String> successful,
    List<String> failed,
    List<String> adminUsers
) {
    public Map<String, Object> toResponse() {
        Map<String, Object> map = new HashMap<>();

        map.put("successfulDeletions", successful);
        map.put("successCount", successful.size());

        if (!failed.isEmpty()) {
            map.put("failedDeletions", failed);
            map.put("failedCount", failed.size());
        }

        if (!adminUsers.isEmpty()) {
            map.put("adminUsers", adminUsers);
            map.put("adminUsersSkipped", adminUsers.size());
            map.put(
                "message",
                "Some users could not be deleted (admins or not found)"
            );
        } else if (!failed.isEmpty()) {
            map.put(
                "message",
                "Some users could not be deleted (not found or invalid ID)"
            );
        } else {
            map.put("message", "All users deleted successfully");
        }

        return map;
    }
}

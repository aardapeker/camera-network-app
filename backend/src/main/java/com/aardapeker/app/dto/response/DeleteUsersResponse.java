package com.aardapeker.app.dto.response;

import java.util.List;

public record DeleteUsersResponse(
    String message,
    List<String> successfulDeletions,
    int successCount,
    List<String> failedDeletions,
    int failedCount,
    List<String> adminUsersSkipped,
    int adminUsersSkippedCount
) {
    public static DeleteUsersResponse from(DeleteUsersResult result) {
        String message;
        if (!result.adminUsers().isEmpty()) {
            message = "Some users could not be deleted (admins or not found)";
        } else if (!result.failed().isEmpty()) {
            message = "Some users could not be deleted (not found or invalid ID)";
        } else {
            message = "All users deleted successfully";
        }

        return new DeleteUsersResponse(
            message,
            result.successful(),
            result.successful().size(),
            result.failed(),
            result.failed().size(),
            result.adminUsers(),
            result.adminUsers().size()
        );
    }
}

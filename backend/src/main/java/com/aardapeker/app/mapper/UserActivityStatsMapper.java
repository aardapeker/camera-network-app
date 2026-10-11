package com.aardapeker.app.mapper;

import com.aardapeker.app.dto.UserActivityStats;
import java.time.LocalDateTime;
import java.util.UUID;

public final class UserActivityStatsMapper {

    private UserActivityStatsMapper() {}

    public static UserActivityStats fromRow(Object[] row) {
        if (row == null) {
            return null;
        }
        return new UserActivityStats(
            (UUID) row[0],
            (String) row[1],
            (String) row[2],
            (String) row[3],
            (String) row[4],
            (String) row[5],
            (Long) row[6],
            (Long) row[7],
            (Double) row[8],
            (LocalDateTime) row[9],
            (LocalDateTime) row[10],
            (Long) row[11]
        );
    }
}

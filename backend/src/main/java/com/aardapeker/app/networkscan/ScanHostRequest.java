package com.aardapeker.app.networkscan;

import java.util.List;

public record ScanHostRequest(
        String ip,
        String mac,
        String vendor,
        String hostname,
        List<Integer> ports) {
}

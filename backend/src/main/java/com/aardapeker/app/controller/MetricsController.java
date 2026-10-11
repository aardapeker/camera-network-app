package com.aardapeker.app.controller;

import com.aardapeker.app.dto.ServerMetrics;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.FileReader;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/metrics")
public class MetricsController {

    private final MeterRegistry registry;
    private final String uploadDirAbsolute;

    public MetricsController(MeterRegistry registry,
                             @Value("${file.upload.dir:./uploads}") String uploadDir) {
        this.registry = registry;
        this.uploadDirAbsolute = Paths.get(uploadDir).toAbsolutePath().normalize().toString();
    }

    @GetMapping
    public ResponseEntity<ServerMetrics> getMetrics() {
        long[] ram = readProcMeminfo(); // [total, available] in bytes, or null values
        Long ramTotal = ram[0] >= 0 ? ram[0] : null;
        Long ramUsed  = (ram[0] >= 0 && ram[1] >= 0) ? ram[0] - ram[1] : null;

        return ResponseEntity.ok(new ServerMetrics(
                readGaugeLong("jvm.memory.used", "area", "heap"),
                readGaugeLong("jvm.memory.max", "area", "heap"),
                readGaugeDouble("system.cpu.usage"),
                readGaugeDouble("process.cpu.usage"),
                readGaugeDouble("process.uptime"),
                readDiskGauge("disk.free"),
                readDiskGauge("disk.total"),
                readGaugeInt("jvm.threads.live"),
                readHttpRequestCount(),
                ramTotal,
                ramUsed
        ));
    }

    // Reads /proc/meminfo — available on Linux (Docker/Ubuntu), returns -1 on Windows/unsupported
    private long[] readProcMeminfo() {
        long total = -1, available = -1;
        try (BufferedReader br = new BufferedReader(new FileReader("/proc/meminfo"))) {
            Map<String, Long> values = new HashMap<>();
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(":\\s+");
                if (parts.length == 2) {
                    String key = parts[0].trim();
                    if (key.equals("MemTotal") || key.equals("MemAvailable")) {
                        // Values are in kB — convert to bytes
                        long kb = Long.parseLong(parts[1].trim().replace(" kB", "").trim());
                        values.put(key, kb * 1024);
                    }
                }
                if (values.size() == 2) break;
            }
            total     = values.getOrDefault("MemTotal", -1L);
            available = values.getOrDefault("MemAvailable", -1L);
        } catch (Exception ignored) {
            // /proc/meminfo not available (Windows) — returns -1 sentinel values
        }
        return new long[]{total, available};
    }

    // Disk metrics: try exact path tag first, fall back to first registered gauge
    private Long readDiskGauge(String name) {
        try {
            Gauge g = registry.find(name).tag("path", uploadDirAbsolute).gauge();
            if (g == null) {
                g = registry.find(name).gauges().stream().findFirst().orElse(null);
            }
            if (g == null) return null;
            double v = g.value();
            return (Double.isNaN(v) || v < 0) ? null : (long) v;
        } catch (Exception e) {
            return null;
        }
    }

    private Long readGaugeLong(String name, String tagKey, String tagValue) {
        try {
            Gauge g = registry.find(name).tag(tagKey, tagValue).gauge();
            if (g == null) return null;
            double v = g.value();
            return (Double.isNaN(v) || v < 0) ? null : (long) v;
        } catch (Exception e) {
            return null;
        }
    }

    private Double readGaugeDouble(String name) {
        try {
            Gauge g = registry.find(name).gauge();
            if (g == null) return null;
            double v = g.value();
            return Double.isNaN(v) ? null : v;
        } catch (Exception e) {
            return null;
        }
    }

    private Integer readGaugeInt(String name) {
        try {
            Gauge g = registry.find(name).gauge();
            if (g == null) return null;
            double v = g.value();
            return Double.isNaN(v) ? null : (int) v;
        } catch (Exception e) {
            return null;
        }
    }

    private Long readHttpRequestCount() {
        try {
            double total = registry.find("http.server.requests")
                    .timers()
                    .stream()
                    .mapToDouble(t -> (double) t.count())
                    .sum();
            return (long) total;
        } catch (Exception e) {
            return null;
        }
    }
}

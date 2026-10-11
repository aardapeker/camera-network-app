package com.aardapeker.app.dto.response;

import com.aardapeker.app.model.Topology;
import java.util.List;

public record TopologyListResponse(
    List<TopologyResponse> topologies,
    int count,
    String message
) {
    public static TopologyListResponse from(List<Topology> topologies, String message) {
        List<TopologyResponse> responses = topologies.stream()
            .map(TopologyResponse::from)
            .toList();
        return new TopologyListResponse(responses, responses.size(), message);
    }

    public static TopologyListResponse from(List<Topology> topologies) {
        return from(topologies, null);
    }
}

package com.aardapeker.app.mapper;

import com.aardapeker.app.dto.response.TopologyListResponse;
import com.aardapeker.app.dto.response.TopologyResponse;
import com.aardapeker.app.model.Topology;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class TopologyMapper {

    public TopologyResponse toCreateResponse(Topology topology) {
        return TopologyResponse.from(topology, "Topology created successfully");
    }

    public TopologyResponse toUpdateResponse(Topology topology) {
        return TopologyResponse.from(topology, "Topology updated successfully");
    }

    public TopologyResponse toDuplicateResponse(Topology topology) {
        return TopologyResponse.from(topology, "Topology duplicated successfully");
    }

    public TopologyResponse toResponse(Topology topology) {
        return TopologyResponse.from(topology);
    }

    public TopologyListResponse toListResponse(List<Topology> topologies, String clientUsername) {
        return TopologyListResponse.from(
            topologies,
            "Topologies retrieved successfully for client: " + clientUsername
        );
    }

    public TopologyListResponse toAllTopologiesResponse(List<Topology> topologies) {
        return TopologyListResponse.from(topologies, "All topologies retrieved successfully");
    }
}

package com.aardapeker.app.service;

import com.aardapeker.app.dto.request.SaveTopologyRequest;
import com.aardapeker.app.model.Topology;
import com.aardapeker.app.model.User;
import java.util.List;

public interface TopologyService {

    List<User> getClients();

    List<Topology> getTopologiesByClient(String clientUsername);

    List<Topology> getAllTopologies();

    List<Topology> getAllTopologies(String search, String sortBy, String sortDirection, String assignedFilter, String creatorFilter);

    List<Topology> getUnassignedTopologies();

    Topology getTopologyById(String topologyId);

    Topology createTopology(SaveTopologyRequest request, User createdBy);

    List<Topology> getUnassignedTopologiesByCreator(String creatorUsername);

    List<Topology> getAssignedTopologies();

    List<Topology> getTopologiesByCreator(String creatorUsername);

    List<Topology> getTopologiesByCreator(String creatorUsername, String search, String sortBy, String sortDirection);

    Topology updateTopology(String topologyId, SaveTopologyRequest request);

    void deleteTopology(String topologyId);

    Topology duplicateTopology(String topologyId, User createdBy);

    Topology unassignTopology(String topologyId);
}

package com.aardapeker.app.controller;

import com.aardapeker.app.dto.request.SaveTopologyRequest;
import com.aardapeker.app.dto.response.TopologyListResponse;
import com.aardapeker.app.dto.response.TopologyResponse;
import com.aardapeker.app.dto.response.UserResponse;
import com.aardapeker.app.mapper.TopologyMapper;
import com.aardapeker.app.mapper.UserMapper;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.Topology;
import com.aardapeker.app.model.User;
import com.aardapeker.app.service.TopologyService;
import com.aardapeker.app.validation.TopologyValidator;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/topologies")
public class TopologyController {

    private final TopologyService topologyService;
    private final TopologyValidator topologyValidator;
    private final TopologyMapper topologyMapper;
    private final UserMapper userMapper;

    public TopologyController(
            TopologyService topologyService,
            TopologyValidator topologyValidator,
            TopologyMapper topologyMapper,
            UserMapper userMapper) {
        this.topologyService = topologyService;
        this.topologyValidator = topologyValidator;
        this.topologyMapper = topologyMapper;
        this.userMapper = userMapper;
    }

    @GetMapping("/clients")
    public ResponseEntity<List<UserResponse>> getClients(@AuthenticationPrincipal User user) {
        topologyValidator.validateWriteAccess(user);
        List<UserResponse> clients = topologyService.getClients()
                .stream()
                .map(userMapper::toResponse)
                .toList();
        return ResponseEntity.ok(clients);
    }

    @GetMapping("")
    public ResponseEntity<TopologyListResponse> getAllTopologies(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) String assigned,
            @RequestParam(required = false) String creator) {
        boolean hasViewAll = topologyValidator.hasCustomPermission(user, com.aardapeker.app.model.CustomPermission.VIEW_ALL_TOPOLOGIES);
        if (!hasViewAll) topologyValidator.validateWriteAccess(user);
        // TECH (and CUSTOM without VIEW_ALL) only see assigned topologies
        boolean limitToAssigned = user.hasRole(Role.ROLE_TECH)
                || (user.hasRole(Role.ROLE_CUSTOM) && !hasViewAll);
        List<Topology> topologies = limitToAssigned
                ? topologyService.getAssignedTopologies()
                : topologyService.getAllTopologies(search, sortBy, sortDirection, assigned, creator);
        return ResponseEntity.ok(topologyMapper.toAllTopologiesResponse(topologies));
    }

    @GetMapping("/my")
    public ResponseEntity<TopologyListResponse> getMyTopologies(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection) {
        topologyValidator.validateWriteAccess(user);
        List<Topology> topologies = topologyService.getTopologiesByCreator(user.getUsername(), search, sortBy, sortDirection);
        return ResponseEntity.ok(topologyMapper.toAllTopologiesResponse(topologies));
    }

    @GetMapping("/unassigned")
    public ResponseEntity<TopologyListResponse> getUnassignedTopologies(@AuthenticationPrincipal User user) {
        topologyValidator.validateWriteAccess(user);
        boolean ownOnly = user.hasRole(Role.ROLE_TECH) || user.hasRole(Role.ROLE_MODERATOR)
                || (user.hasRole(Role.ROLE_CUSTOM)
                        && !topologyValidator.hasCustomPermission(user, com.aardapeker.app.model.CustomPermission.VIEW_ALL_TOPOLOGIES));
        List<Topology> topologies = ownOnly
                ? topologyService.getUnassignedTopologiesByCreator(user.getUsername())
                : topologyService.getUnassignedTopologies();
        return ResponseEntity.ok(topologyMapper.toAllTopologiesResponse(topologies));
    }

    @GetMapping("/{topologyId}")
    public ResponseEntity<TopologyResponse> getTopologyById(
            @PathVariable String topologyId,
            @AuthenticationPrincipal User user) {
        topologyValidator.validateTopologyId(topologyId);
        Topology topology = topologyService.getTopologyById(topologyId);
        topologyValidator.validateClientTopologyAccess(user, topology);
        return ResponseEntity.ok(topologyMapper.toResponse(topology));
    }

    @GetMapping("/client/{clientUsername}")
    public ResponseEntity<TopologyListResponse> getTopologiesByClient(
            @PathVariable String clientUsername,
            @AuthenticationPrincipal User user) {
        topologyValidator.validateClientUsername(clientUsername);
        topologyValidator.validateClientAccess(user, clientUsername);
        List<Topology> topologies = topologyService.getTopologiesByClient(clientUsername);
        return ResponseEntity.ok(topologyMapper.toListResponse(topologies, clientUsername));
    }

    @PostMapping("/save")
    public ResponseEntity<TopologyResponse> createTopology(
            @Valid @RequestBody SaveTopologyRequest request,
            @AuthenticationPrincipal User user) {
        topologyValidator.validateWriteAccess(user);
        topologyValidator.validateTechClientAssignment(user, request);
        Topology topology = topologyService.createTopology(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(topologyMapper.toCreateResponse(topology));
    }

    @PutMapping("/{topologyId}")
    public ResponseEntity<TopologyResponse> updateTopology(
            @PathVariable String topologyId,
            @Valid @RequestBody SaveTopologyRequest request,
            @AuthenticationPrincipal User user) {
        topologyValidator.validateTopologyId(topologyId);
        topologyValidator.validateWriteAccess(user);
        topologyValidator.validateTechAccess(user, topologyService.getTopologyById(topologyId));
        topologyValidator.validateTechClientAssignment(user, request);
        Topology topology = topologyService.updateTopology(topologyId, request);
        return ResponseEntity.ok(topologyMapper.toUpdateResponse(topology));
    }

    @DeleteMapping("/{topologyId}")
    public ResponseEntity<Void> deleteTopology(
            @PathVariable String topologyId,
            @AuthenticationPrincipal User user) {
        topologyValidator.validateTopologyId(topologyId);
        topologyValidator.validateWriteAccess(user);
        topologyValidator.validateTechAccess(user, topologyService.getTopologyById(topologyId));
        topologyService.deleteTopology(topologyId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{topologyId}/unassign")
    public ResponseEntity<TopologyResponse> unassignTopology(
            @PathVariable String topologyId,
            @AuthenticationPrincipal User user) {
        topologyValidator.validateTopologyId(topologyId);
        topologyValidator.validateSuperiorRole(user);
        Topology topology = topologyService.unassignTopology(topologyId);
        return ResponseEntity.ok(topologyMapper.toUpdateResponse(topology));
    }

    @PostMapping("/{topologyId}/duplicate")
    public ResponseEntity<TopologyResponse> duplicateTopology(
            @PathVariable String topologyId,
            @AuthenticationPrincipal User user) {
        topologyValidator.validateTopologyId(topologyId);
        topologyValidator.validateWriteAccess(user);
        topologyValidator.validateTechAccess(user, topologyService.getTopologyById(topologyId));
        Topology topology = topologyService.duplicateTopology(topologyId, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(topologyMapper.toDuplicateResponse(topology));
    }
}

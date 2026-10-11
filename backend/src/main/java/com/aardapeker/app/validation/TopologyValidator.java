package com.aardapeker.app.validation;

import com.aardapeker.app.dto.request.SaveTopologyRequest;
import com.aardapeker.app.exception.AuthenticationException;
import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.exception.ForbiddenActionException;
import com.aardapeker.app.model.CustomPermission;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.Topology;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.UserPermissionRepository;
import org.springframework.stereotype.Component;

@Component
public class TopologyValidator {

    private final UserPermissionRepository userPermissionRepository;

    public TopologyValidator(UserPermissionRepository userPermissionRepository) {
        this.userPermissionRepository = userPermissionRepository;
    }

    public void validateUser(User user) {
        if (user == null) {
            throw new AuthenticationException("Unauthorized");
        }
    }

    public void validateClientAccess(User user, String clientUsername) {
        validateUser(user);
        if (isEffectiveClient(user) && !user.getUsername().equals(clientUsername)) {
            throw new ForbiddenActionException("Clients cannot access other clients' topologies");
        }
    }

    public void validateClientTopologyAccess(User user, Topology topology) {
        validateUser(user);
        if (!isEffectiveClient(user)) return;
        boolean assigned = topology.getClients() != null &&
                topology.getClients().stream().anyMatch(c -> c.getUsername().equals(user.getUsername()));
        if (!assigned) {
            throw new ForbiddenActionException("Clients can only access their own assigned topologies");
        }
    }

    public void validateWriteAccess(User user) {
        validateUser(user);
        if (isEffectiveClient(user)) {
            throw new ForbiddenActionException("Clients have read-only access and cannot modify topologies");
        }
    }

    public void validateTechAccess(User user, Topology topology) {
        validateUser(user);
        if (!isEffectiveTechOrModerator(user)) return;

        if (topology.getClients() != null && !topology.getClients().isEmpty()) {
            throw new ForbiddenActionException("You can only edit unassigned topologies");
        }
        if (topology.getCreatedBy() != null &&
                !topology.getCreatedBy().getUsername().equals(user.getUsername())) {
            throw new ForbiddenActionException("You can only edit your own draft topologies");
        }
    }

    public void validateTechClientAssignment(User user, SaveTopologyRequest request) {
        validateUser(user);
        if (isEffectiveTechNoAssign(user) &&
                request.clientUsernames() != null && !request.clientUsernames().isEmpty()) {
            throw new ForbiddenActionException("Tech users cannot assign topologies to clients");
        }
    }

    public void validateTopologyId(String topologyId) {
        if (topologyId == null || topologyId.isBlank()) {
            throw new BadRequestException("Topology ID is required");
        }
    }

    public void validateClientUsername(String clientUsername) {
        if (clientUsername == null || clientUsername.isBlank()) {
            throw new BadRequestException("Client username is required");
        }
    }

    public void validateSuperiorRole(User user) {
        validateUser(user);
        boolean isSuperior = user.hasRole(Role.ROLE_ADMIN)
            || user.hasRole(Role.ROLE_DEVELOPER)
            || user.hasRole(Role.ROLE_MANAGER);
        boolean hasUnassignPermission = hasCustomPermission(user, CustomPermission.EDIT_CLIENT_ASSIGNED);
        if (!isSuperior && !hasUnassignPermission) {
            throw new ForbiddenActionException("Only admin, developer, or manager can unassign topologies");
        }
    }

    // ===== Permission resolution helpers =====

    /** Returns true if this user effectively has CLIENT-level access (read-only, own assigned only). */
    public boolean isEffectiveClient(User user) {
        if (user.hasRole(Role.ROLE_CLIENT)) return true;
        if (!user.hasRole(Role.ROLE_CUSTOM)) return false;
        // CUSTOM: acts as client unless they have write permissions
        return !hasCustomPermission(user, CustomPermission.CREATE_TOPOLOGY)
            && !hasCustomPermission(user, CustomPermission.EDIT_OWN_UNASSIGNED)
            && !hasCustomPermission(user, CustomPermission.EDIT_CLIENT_ASSIGNED);
    }

    /**
     * Returns true if this user is restricted to editing only their own unassigned topologies
     * (ROLE_TECH or ROLE_MODERATOR behavior, or CUSTOM without EDIT_CLIENT_ASSIGNED).
     */
    public boolean isEffectiveTechOrModerator(User user) {
        if (user.hasRole(Role.ROLE_TECH) || user.hasRole(Role.ROLE_MODERATOR)) return true;
        if (!user.hasRole(Role.ROLE_CUSTOM)) return false;
        // CUSTOM with write access but NOT edit-client-assigned AND NOT edit-all-unassigned → own-only restriction
        boolean canWrite = hasCustomPermission(user, CustomPermission.CREATE_TOPOLOGY)
            || hasCustomPermission(user, CustomPermission.EDIT_OWN_UNASSIGNED);
        boolean canEditClient = hasCustomPermission(user, CustomPermission.EDIT_CLIENT_ASSIGNED);
        boolean canEditAllUnassigned = hasCustomPermission(user, CustomPermission.EDIT_ALL_UNASSIGNED);
        return canWrite && !canEditClient && !canEditAllUnassigned;
    }

    /**
     * Returns true if this user cannot assign topologies to clients
     * (ROLE_TECH behavior, or CUSTOM without ASSIGN_TO_CLIENT).
     */
    public boolean isEffectiveTechNoAssign(User user) {
        if (user.hasRole(Role.ROLE_TECH)) return true;
        if (!user.hasRole(Role.ROLE_CUSTOM)) return false;
        return !hasCustomPermission(user, CustomPermission.ASSIGN_TO_CLIENT);
    }

    public boolean hasCustomPermission(User user, CustomPermission permission) {
        return userPermissionRepository.existsByUserAndPermission(user, permission);
    }
}

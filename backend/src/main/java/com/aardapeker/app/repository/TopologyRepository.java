package com.aardapeker.app.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aardapeker.app.model.Topology;

public interface TopologyRepository extends JpaRepository<Topology, String> {
  @EntityGraph(attributePaths = {
      "devices",
      "rackCabins",
      "rackCabins.devices",
      "workstations",
      "workstations.sockets",
      "connections",
      "clients"
  })
  @Query("SELECT t FROM Topology t JOIN t.clients c WHERE c.username = :username")
  List<Topology> findByClientUsername(@Param("username") String username);

  @EntityGraph(attributePaths = {
      "devices",
      "rackCabins",
      "rackCabins.devices",
      "workstations",
      "workstations.sockets",
      "connections",
      "clients",
      "createdBy"
  })
  @Query("SELECT t FROM Topology t")
  List<Topology> findAllWithDetails();

  @EntityGraph(attributePaths = {"clients"})
  @Query("SELECT t FROM Topology t WHERE t.blueprintPictureUrl IS NOT NULL")
  List<Topology> findAllWithBlueprintUrls();

  @EntityGraph(attributePaths = {
      "devices",
      "rackCabins",
      "rackCabins.devices",
      "workstations",
      "workstations.sockets",
      "connections",
      "clients"
  })
  @Query("SELECT t FROM Topology t WHERE t.id = :id")
  Optional<Topology> findByIdWithDetails(@Param("id") String id);

  @Modifying
  @Query(value = "DELETE FROM topology_clients WHERE user_id = :userId", nativeQuery = true)
  void unassignTopologiesByUserId(@Param("userId") java.util.UUID userId);

  @EntityGraph(attributePaths = {
      "devices",
      "rackCabins",
      "rackCabins.devices",
      "workstations",
      "workstations.sockets",
      "connections",
      "createdBy"
  })
  @Query("SELECT t FROM Topology t WHERE t.clients IS EMPTY")
  List<Topology> findUnassigned();

  @EntityGraph(attributePaths = {
      "devices",
      "rackCabins",
      "rackCabins.devices",
      "workstations",
      "workstations.sockets",
      "connections",
      "createdBy"
  })
  @Query("SELECT t FROM Topology t WHERE t.clients IS EMPTY AND t.createdBy.username = :username")
  List<Topology> findUnassignedByCreatorUsername(@Param("username") String username);

  @EntityGraph(attributePaths = {
      "devices",
      "rackCabins",
      "rackCabins.devices",
      "workstations",
      "workstations.sockets",
      "connections",
      "clients"
  })
  @Query("SELECT t FROM Topology t WHERE t.clients IS NOT EMPTY")
  List<Topology> findAllAssigned();

  @EntityGraph(attributePaths = {
      "devices",
      "rackCabins",
      "rackCabins.devices",
      "workstations",
      "workstations.sockets",
      "connections",
      "clients",
      "createdBy"
  })
  @Query("SELECT t FROM Topology t WHERE t.createdBy.username = :username")
  List<Topology> findByCreatorUsername(@Param("username") String username);
}

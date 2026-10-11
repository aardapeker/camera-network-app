package com.aardapeker.app.model;

/**
 * Fine-grained permission flags for users with ROLE_CUSTOM.
 * By default, ROLE_CUSTOM users have no permissions (equivalent to ROLE_CLIENT
 * with only VIEW_OWN_ASSIGNED). Admins can grant any combination of these flags
 * per user via the admin panel.
 */
public enum CustomPermission {
    /** Can access the admin panel (ADMIN/DEV/MANAGER only by default) */
    ACCESS_ADMIN_PANEL,
    /** Can view all topologies (assigned + unassigned, all creators) */
    VIEW_ALL_TOPOLOGIES,
    /** Can view their own unassigned topologies */
    VIEW_OWN_UNASSIGNED,
    /** Can create new topologies */
    CREATE_TOPOLOGY,
    /** Can edit their own unassigned topologies */
    EDIT_OWN_UNASSIGNED,
    /** Can assign a topology to a client */
    ASSIGN_TO_CLIENT,
    /** Can edit and delete all unassigned topologies (regardless of creator) */
    EDIT_ALL_UNASSIGNED,
    /** Can edit, delete and unassign client-assigned topologies */
    EDIT_CLIENT_ASSIGNED,
    /** Can view topologies assigned to them as a client */
    VIEW_OWN_ASSIGNED
}

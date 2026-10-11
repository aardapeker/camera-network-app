import { useState, useCallback } from "react"
import type {
  TopologyDevice,
  TopologyConnection,
  Position,
  DeviceType,
} from "~/types"

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export function useTopologyState() {
  const [devices, setDevices] = useState<TopologyDevice[]>([])
  const [connections, setConnections] = useState<TopologyConnection[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [connectionMode, setConnectionMode] = useState(false)
  const [pendingConnectionSource, setPendingConnectionSource] = useState<
    string | null
  >(null)

  const addDevice = useCallback((type: DeviceType, position: Position) => {
    const newDevice: TopologyDevice = {
      id: generateId(),
      type,
      position,
      label: type.replace("_", " "),
      rotation: 0,
    }
    setDevices((prev) => [...prev, newDevice])
  }, [])

  const moveDevice = useCallback((deviceId: string, newPosition: Position) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, position: newPosition } : device
      )
    )
  }, [])

  const removeDevice = useCallback(
    (deviceId: string) => {
      setDevices((prev) => prev.filter((d) => d.id !== deviceId))
      setConnections((prev) =>
        prev.filter(
          (c) =>
            c.sourceDeviceId !== deviceId && c.targetDeviceId !== deviceId
        )
      )
      if (selectedDeviceId === deviceId) setSelectedDeviceId(null)
    },
    [selectedDeviceId]
  )

  const updateDeviceLabel = useCallback((deviceId: string, label: string) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, label } : device
      )
    )
  }, [])

  const rotateDevice = useCallback((deviceId: string, rotation: number) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, rotation } : device
      )
    )
  }, [])

  const changeDeviceColor = useCallback((deviceId: string, color: string) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, color } : device
      )
    )
  }, [])

  const addConnection = useCallback(
    (sourceId: string, targetId: string) => {
      const exists = connections.some(
        (c) =>
          (c.sourceDeviceId === sourceId && c.targetDeviceId === targetId) ||
          (c.sourceDeviceId === targetId && c.targetDeviceId === sourceId)
      )
      if (exists || sourceId === targetId) return

      const newConnection: TopologyConnection = {
        id: generateId(),
        sourceDeviceId: sourceId,
        targetDeviceId: targetId,
      }
      setConnections((prev) => [...prev, newConnection])
    },
    [connections]
  )

  const removeConnection = useCallback((connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId))
  }, [])

  const changeConnectionColor = useCallback((connectionId: string, color: string) => {
    setConnections((prev) =>
      prev.map((connection) =>
        connection.id === connectionId ? { ...connection, color } : connection
      )
    )
  }, [])

  const changeConnectionLineType = useCallback((connectionId: string, lineType: "solid" | "dashed") => {
    setConnections((prev) =>
      prev.map((connection) =>
        connection.id === connectionId ? { ...connection, lineType } : connection
      )
    )
  }, [])

  const handleDeviceClick = useCallback(
    (deviceId: string) => {
      if (connectionMode) {
        if (pendingConnectionSource === null) {
          setPendingConnectionSource(deviceId)
        } else {
          addConnection(pendingConnectionSource, deviceId)
          setPendingConnectionSource(null)
        }
      } else {
        setSelectedDeviceId(deviceId === selectedDeviceId ? null : deviceId)
      }
    },
    [connectionMode, pendingConnectionSource, selectedDeviceId, addConnection]
  )

  const toggleConnectionMode = useCallback(() => {
    setConnectionMode((prev) => !prev)
    setPendingConnectionSource(null)
  }, [])

  const clearAll = useCallback(() => {
    setDevices([])
    setConnections([])
    setSelectedDeviceId(null)
    setPendingConnectionSource(null)
    setConnectionMode(false)
  }, [])

  return {
    devices,
    connections,
    selectedDeviceId,
    connectionMode,
    pendingConnectionSource,
    addDevice,
    moveDevice,
    removeDevice,
    updateDeviceLabel,
    rotateDevice,
    changeDeviceColor,
    addConnection,
    removeConnection,
    changeConnectionColor,
    changeConnectionLineType,
    setSelectedDeviceId,
    handleDeviceClick,
    toggleConnectionMode,
    clearAll,
  }
}
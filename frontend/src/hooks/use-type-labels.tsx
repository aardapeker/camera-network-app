import { useTranslation } from "react-i18next"
import {
  DeviceType,
  CameraSubtype,
  InfrastructureType,
  SocketType,
} from "~/components/icons"

/**
 * Returns translated label maps for the topology equipment enums.
 * Mirrors the static `deviceLabels` / `socketLabels` / etc. maps in icons.tsx
 * but resolved through i18n so editor/viewer UI reflects the active language.
 */
export function useTypeLabels() {
  const { t } = useTranslation()

  const deviceLabels: Record<DeviceType, string> = {
    [DeviceType.CAMERA]: t("types.deviceCamera"),
    [DeviceType.SWITCH]: t("types.deviceSwitch"),
    [DeviceType.NVR]: t("types.deviceNvr"),
    [DeviceType.ROUTER]: t("types.deviceRouter"),
    [DeviceType.ACCESS_POINT]: t("types.deviceAccessPoint"),
    [DeviceType.UPS]: t("types.deviceUps"),
    [DeviceType.HORN_SPEAKER]: t("types.deviceHornSpeaker"),
  }

  const cameraSubtypeLabels: Record<CameraSubtype, string> = {
    [CameraSubtype.DOME]: t("types.cameraDome"),
    [CameraSubtype.BULLET]: t("types.cameraBullet"),
    [CameraSubtype.SPEED_DOME]: t("types.cameraSpeedDome"),
    [CameraSubtype.THERMAL]: t("types.cameraThermal"),
    [CameraSubtype.FISHEYE]: t("types.cameraFisheye"),
    [CameraSubtype.MOTORIZED_BULLET]: t("types.cameraMotorizedBullet"),
  }

  const infrastructureLabels: Record<InfrastructureType, string> = {
    [InfrastructureType.RACK_CABIN]: t("types.infraRackCabin"),
    [InfrastructureType.WORKSTATION]: t("types.infraWorkstation"),
  }

  const socketLabels: Record<SocketType, string> = {
    [SocketType.UPS]: t("types.socketUps"),
    [SocketType.CAT6]: t("types.socketCat6"),
    [SocketType.NORMAL]: t("types.socketNormal"),
  }

  return { deviceLabels, cameraSubtypeLabels, infrastructureLabels, socketLabels }
}

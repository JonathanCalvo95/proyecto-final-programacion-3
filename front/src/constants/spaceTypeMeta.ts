import { MeetingRoom, Desk, Apartment } from '@mui/icons-material'
import type { SpaceType } from '../types/enums'

export type SpaceTypeMeta = {
  label: string
  Icon: any
  color: 'primary' | 'success' | 'warning'
}

export const SPACE_TYPE_META: Record<SpaceType, SpaceTypeMeta> = {
  meeting_room: { label: 'Sala de reunión', Icon: MeetingRoom, color: 'primary' },
  desk: { label: 'Escritorio', Icon: Desk, color: 'success' },
  private_office: { label: 'Oficina privada', Icon: Apartment, color: 'warning' },
}

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  meeting_room: SPACE_TYPE_META.meeting_room.label,
  desk: SPACE_TYPE_META.desk.label,
  private_office: SPACE_TYPE_META.private_office.label,
}

export function getSpaceTypeMeta(type: SpaceType): SpaceTypeMeta {
  return SPACE_TYPE_META[type]
}

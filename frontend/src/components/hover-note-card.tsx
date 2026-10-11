import type { TopologyDevice } from '~/types'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card'

interface HoverNoteCardProps {
  device: TopologyDevice
  children: React.ReactNode
  disabled?: boolean
}

const HoverNoteCard = ({ device, children, disabled = false }: HoverNoteCardProps) => {
  const formatDeviceType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (disabled) {
    return <>{children}</>
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className='w-64' side='top' sideOffset={8}>
        <div className='space-y-2'>
          <div className='space-y-1'>
            <p className='text-sm font-semibold'>{device.label}</p>
            <div className='space-y-0.5'>
              <p className='text-muted-foreground text-xs'>
                <span className='font-medium'>Type:</span> {formatDeviceType(device.type)}
              </p>
              <p className='text-muted-foreground text-xs'>
                <span className='font-medium'>ID:</span> {device.id}
              </p>
              <p className='text-muted-foreground text-xs'>
                <span className='font-medium'>Position:</span> ({Math.round(device.position.x)}, {Math.round(device.position.y)})
              </p>
              {device.rotation !== 0 && (
                <p className='text-muted-foreground text-xs'>
                  <span className='font-medium'>Rotation:</span> {device.rotation}°
                </p>
              )}
              {device.color && device.color !== 'currentColor' && (
                <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                  <span className='font-medium'>Color:</span>
                  <span
                    className='inline-block h-3 w-3 rounded border'
                    style={{ backgroundColor: device.color }}
                  />
                </p>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default HoverNoteCard

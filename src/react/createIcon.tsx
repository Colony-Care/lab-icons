import { forwardRef } from 'react'
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Width and height. A number is in pixels; a string is used as is ('1em'). Default 24. */
  size?: number | string
  /** Accessible name. Adds a <title> and role="img". */
  title?: string
}

export function createIcon(
  displayName: string,
  viewBox: string,
  body: string,
): ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>> {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = 24, title, ...props },
    ref,
  ) {
    const named = Boolean(title || props['aria-label'] || props['aria-labelledby'])
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        fill="currentColor"
        width={size}
        height={size}
        role={named ? 'img' : undefined}
        aria-hidden={named ? undefined : true}
        {...props}
        ref={ref}
      >
        {title ? <title>{title}</title> : null}
        {/* body comes from this repo's own SVG files at build time, never from user input */}
        <g dangerouslySetInnerHTML={{ __html: body }} />
      </svg>
    )
  })
  Icon.displayName = displayName
  return Icon
}
